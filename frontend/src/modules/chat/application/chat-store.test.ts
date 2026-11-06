import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api'
import type { ChatGateway } from '../adapters/http/http-chat-gateway'
import type { Chat, ChatMessage } from '../domain/chat'
import { createChatStore } from './chat-store'

const firstChat: Chat = {
  id: 1,
  integrationId: 7,
  title: 'Продажи',
  createdAt: '2026-11-06T10:00:00Z',
}

const secondChat: Chat = { ...firstChat, id: 2, integrationId: 8, title: 'Филиал' }
const userMessage: ChatMessage = {
  id: 10,
  chatId: 1,
  integrationId: 7,
  role: 'user',
  content: 'Покажи продажи',
  widget: null,
  createdAt: '2026-11-06T10:01:00Z',
}
const assistantMessage: ChatMessage = {
  ...userMessage,
  id: 11,
  role: 'assistant',
  content: 'Готово',
  widget: {
    title: 'Продажи',
    columns: [{ key: 'revenue', label: 'Выручка', type: 'money' }],
    rows: [{ revenue: 100 }],
    totals: { revenue: 100 },
  },
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function gateway(overrides: Partial<ChatGateway> = {}): ChatGateway {
  return {
    listChats: vi.fn().mockResolvedValue([firstChat, secondChat]),
    createChat: vi.fn().mockResolvedValue(firstChat),
    updateChat: vi.fn().mockResolvedValue({ ...firstChat, title: 'Обновлено' }),
    deleteChat: vi.fn().mockResolvedValue(undefined),
    listMessages: vi.fn().mockResolvedValue([]),
    sendMessage: vi.fn().mockResolvedValue(assistantMessage),
    ...overrides,
  }
}

describe('createChatStore', () => {
  it('loads chats, supports an empty list and deduplicates the request', async () => {
    const pending = deferred<readonly Chat[]>()
    const api = gateway({ listChats: vi.fn().mockReturnValue(pending.promise) })
    const store = createChatStore(api)

    const first = store.loadChats()
    const second = store.loadChats()
    expect(first).toBe(second)
    pending.resolve([])
    await first

    expect(store.getSnapshot().chats).toEqual({ status: 'success', items: [] })
  })

  it('creates, renames, switches and deletes a chat', async () => {
    const api = gateway({
      createChat: vi.fn().mockResolvedValue(secondChat),
      updateChat: vi.fn().mockResolvedValue({ ...secondChat, integrationId: 9, title: 'Новый' }),
    })
    const store = createChatStore(api)
    await store.loadChats()
    await store.createChat({ integrationId: 8 })
    await store.updateChat(2, { integrationId: 9, title: 'Новый' })
    await store.deleteChat(2)

    expect(api.createChat).toHaveBeenCalledWith({ integrationId: 8 }, expect.anything())
    expect(api.updateChat).toHaveBeenCalledWith(2, { integrationId: 9, title: 'Новый' }, expect.anything())
    expect(api.deleteChat).toHaveBeenCalledWith(2, expect.anything())
    expect(store.getSnapshot().chats).toMatchObject({ status: 'success', items: [firstChat] })
    expect(store.getSnapshot().selectedChatId).toBeUndefined()
  })

  it('loads only the current chat history when selection changes', async () => {
    const firstHistory = deferred<readonly ChatMessage[]>()
    const api = gateway({
      listMessages: vi.fn((id: number) => id === 1 ? firstHistory.promise : Promise.resolve([assistantMessage])),
    })
    const store = createChatStore(api)
    await store.loadChats()
    const stale = store.selectChat(1)
    await store.selectChat(2)
    firstHistory.resolve([userMessage])
    await stale

    expect(store.getSnapshot().selectedChatId).toBe(2)
    expect(store.getSnapshot().messages).toEqual({ status: 'success', chatId: 2, items: [assistantMessage] })
  })

  it('sends one message, then refreshes history and keeps the widget', async () => {
    const api = gateway({ listMessages: vi.fn().mockResolvedValue([userMessage, assistantMessage]) })
    const store = createChatStore(api)
    await store.loadChats()
    await store.selectChat(1)
    await store.sendMessage({ content: '  Покажи продажи  ' })

    expect(api.sendMessage).toHaveBeenCalledOnce()
    expect(api.sendMessage).toHaveBeenCalledWith(1, { content: 'Покажи продажи' }, expect.anything())
    expect(store.getSnapshot().messages).toMatchObject({ status: 'success', items: [userMessage, assistantMessage] })
    expect(store.getSnapshot().sending).toEqual({ status: 'idle' })
  })

  it('blocks duplicate sends and empty messages', async () => {
    const pending = deferred<ChatMessage>()
    const api = gateway({ sendMessage: vi.fn().mockReturnValue(pending.promise) })
    const store = createChatStore(api)
    await store.loadChats()
    await store.selectChat(1)

    const first = store.sendMessage({ content: 'Вопрос' })
    const second = store.sendMessage({ content: 'Вопрос 2' })
    await store.sendMessage({ content: '   ' })
    expect(api.sendMessage).toHaveBeenCalledOnce()
    pending.resolve(assistantMessage)
    await Promise.all([first, second])
  })

  it.each([401, 403, 409, 422, 429, 502])('exposes HTTP %s without automatic retry', async (status) => {
    const error = new ApiError('Request failed', { kind: 'http', status })
    const api = gateway({ listChats: vi.fn().mockRejectedValue(error) })
    const session = { expireSession: vi.fn() }
    const store = createChatStore(api, session)
    await store.loadChats()

    if (status === 401) {
      expect(store.getSnapshot().chats).toEqual({ status: 'idle' })
    } else {
      expect(store.getSnapshot().chats).toMatchObject({ status: 'error', error })
    }
    expect(api.listChats).toHaveBeenCalledOnce()
    expect(session.expireSession).toHaveBeenCalledTimes(status === 401 ? 1 : 0)
  })

  it('resets state and ignores responses from the previous session', async () => {
    const pending = deferred<readonly ChatMessage[]>()
    const api = gateway({ listMessages: vi.fn().mockReturnValue(pending.promise) })
    const store = createChatStore(api)
    await store.loadChats()
    const request = store.selectChat(1)
    store.reset()
    pending.resolve([assistantMessage])
    await request

    expect(store.getSnapshot()).toEqual({
      chats: { status: 'idle' },
      messages: { status: 'idle' },
      sending: { status: 'idle' },
      mutation: { status: 'idle' },
    })
  })
})
