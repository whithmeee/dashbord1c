import type { ApiError } from '../../../shared/api'
import type { ChatGateway } from '../adapters/http/http-chat-gateway'
import type { Chat, CreateChatInput, SendMessageInput, UpdateChatInput } from '../domain/chat'
import { createChatMutations } from './chat-mutations'
import { createChatSending } from './chat-sending'
import type { ChatListState, ChatState } from './chat-state'

export type { ChatListState, ChatMessagesState, ChatMutationState, ChatState } from './chat-state'

export interface ChatSessionDependency {
  expireSession(): void
}

export interface ChatStore {
  getSnapshot(): ChatState
  subscribe(listener: () => void): () => void
  loadChats(): Promise<void>
  createChat(input: CreateChatInput): Promise<void>
  selectChat(id: number): Promise<void>
  updateChat(id: number, input: UpdateChatInput): Promise<void>
  deleteChat(id: number): Promise<void>
  sendMessage(input: SendMessageInput): Promise<void>
  refreshMessages(): Promise<void>
  reset(): void
}

export function createChatStore(
  gateway: ChatGateway,
  session: ChatSessionDependency = { expireSession: () => undefined },
): ChatStore {
  let state: ChatState = {
    chats: { status: 'idle' },
    messages: { status: 'idle' },
    sending: { status: 'idle' },
    mutation: { status: 'idle' },
  }
  let revision = 0
  let messageRevision = 0
  let listRequest: Promise<void> | undefined
  let listController: AbortController | undefined
  let messageRequest: Promise<boolean> | undefined
  let messageController: AbortController | undefined
  const listeners = new Set<() => void>()
  const sending = createChatSending(gateway, {
    getState: () => state,
    publish,
    current,
    revision: () => revision,
    reset,
    session,
    loadMessages,
    messageError,
  })
  const mutations = createChatMutations(gateway, {
    getState: () => state,
    publish,
    current,
    revision: () => revision,
    reset,
    session,
    chatItems,
    hasChat,
    loadMessages,
  })

  function publish(next: ChatState): void {
    state = next
    listeners.forEach((listener) => listener())
  }

  function current(operationRevision: number): boolean {
    return revision === operationRevision
  }

  function loadChats(): Promise<void> {
    if (listRequest) {
      return listRequest
    }

    const operationRevision = revision
    const controller = new AbortController()
    listController = controller
    publish({ ...state, chats: { status: 'loading' } })
    const request = gateway.listChats({ signal: controller.signal })
      .then((items) => {
        if (!current(operationRevision)) return
        const next = { ...state, chats: { status: 'success', items } as ChatListState }
        if (state.selectedChatId !== undefined && items.some((item) => item.id === state.selectedChatId)) {
          next.selectedChatId = state.selectedChatId
        } else {
          delete next.selectedChatId
          next.messages = { status: 'idle' }
        }
        publish(next)
      })
      .catch((error: unknown) => {
        if (!current(operationRevision) || controller.signal.aborted) return
        if (isUnauthorized(error)) {
          reset()
          session.expireSession()
          return
        }
        publish({ ...state, chats: { status: 'error', error: normalizeError(error) } })
      })
      .finally(() => {
        if (listRequest === request) {
          listRequest = undefined
          listController = undefined
        }
      })
    listRequest = request
    return request
  }

  function selectChat(id: number): Promise<void> {
    if (state.sending.status === 'sending' || !hasChat(id)) return Promise.resolve()
    state = { ...state, selectedChatId: id }
    return loadMessages(id).then(() => undefined)
  }

  function refreshMessages(): Promise<void> {
    return state.selectedChatId === undefined
      ? Promise.resolve()
      : loadMessages(state.selectedChatId).then(() => undefined)
  }

  function loadMessages(chatId: number): Promise<boolean> {
    const operationRevision = revision
    const selectionRevision = ++messageRevision
    messageController?.abort()
    const controller = new AbortController()
    messageController = controller
    publish({ ...state, messages: { status: 'loading', chatId } })
    const request = gateway.listMessages(chatId, { signal: controller.signal })
      .then((items) => {
        if (!current(operationRevision) || selectionRevision !== messageRevision || state.selectedChatId !== chatId) return false
        publish({ ...state, messages: { status: 'success', chatId, items } })
        return true
      })
      .catch((error: unknown) => {
        if (!current(operationRevision) || selectionRevision !== messageRevision || controller.signal.aborted) return false
        if (isUnauthorized(error)) {
          reset()
          session.expireSession()
          return false
        }
        publish({ ...state, messages: { status: 'error', chatId, error: normalizeError(error) } })
        return false
      })
      .finally(() => {
        if (messageRequest === request) {
          messageRequest = undefined
          messageController = undefined
        }
      })
    messageRequest = request
    return request
  }

  function reset(): void {
    revision += 1
    messageRevision += 1
    listController?.abort()
    messageController?.abort()
    listRequest = undefined
    messageRequest = undefined
    sending.reset()
    mutations.reset()
    publish({ chats: { status: 'idle' }, messages: { status: 'idle' }, sending: { status: 'idle' }, mutation: { status: 'idle' } })
  }

  function hasChat(id: number): boolean { return chatItems().some((item) => item.id === id) }
  function chatItems(): readonly Chat[] { return state.chats.status === 'success' ? state.chats.items : [] }
  function messageError(): Error { return state.messages.status === 'error' ? state.messages.error : new Error('Chat history failed') }
  function normalizeError(error: unknown): Error { return error instanceof Error ? error : new Error('Chat request failed') }
  function isUnauthorized(error: unknown): boolean { return (error as ApiError | undefined)?.status === 401 }

  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    loadChats,
    createChat: mutations.createChat,
    selectChat,
    updateChat: mutations.updateChat,
    deleteChat: mutations.deleteChat,
    sendMessage: sending.sendMessage,
    refreshMessages,
    reset,
  }
}
