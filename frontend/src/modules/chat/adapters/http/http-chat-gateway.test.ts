import { describe, expect, it, vi } from 'vitest'
import type { ApiClient } from '../../../../shared/api'
import { ApiError } from '../../../../shared/api'
import { createHttpChatGateway } from './http-chat-gateway'

const chatResponse = {
  id: 4,
  integration_id: 9,
  integration: null,
  title: 'Продажи',
  created_at: '2026-11-05T12:00:00Z',
}

const messageResponse = {
  id: 10,
  chat_id: 4,
  integration_id: 9,
  role: 'assistant',
  content: 'Готово',
  widget: null,
  created_at: '2026-11-05T12:02:00Z',
}

describe('createHttpChatGateway', () => {
  it('uses chat and message endpoints with AbortSignal', async () => {
    const get = vi.fn()
      .mockResolvedValueOnce([chatResponse])
      .mockResolvedValueOnce([messageResponse])
    const gateway = createHttpChatGateway({ get } as unknown as ApiClient)
    const signal = new AbortController().signal

    await expect(gateway.listChats({ signal })).resolves.toHaveLength(1)
    await expect(gateway.listMessages(4, { signal })).resolves.toHaveLength(1)
    expect(get).toHaveBeenNthCalledWith(1, '/api/chats', { signal })
    expect(get).toHaveBeenNthCalledWith(2, '/api/chats/4/messages', { signal })
  })

  it('maps create, update, send and delete operations', async () => {
    const post = vi.fn()
      .mockResolvedValueOnce(chatResponse)
      .mockResolvedValueOnce(messageResponse)
    const patch = vi.fn().mockResolvedValue(chatResponse)
    const deleteRequest = vi.fn().mockResolvedValue(undefined)
    const gateway = createHttpChatGateway({ post, patch, delete: deleteRequest } as unknown as ApiClient)

    await gateway.createChat({ integrationId: 9, title: 'Продажи' })
    await gateway.updateChat(4, { integrationId: 9 })
    await gateway.sendMessage(4, { content: 'Покажи продажи' })
    await gateway.deleteChat(4)

    expect(post).toHaveBeenNthCalledWith(1, '/api/chats', { integration_id: 9, title: 'Продажи' }, {})
    expect(patch).toHaveBeenCalledWith('/api/chats/4', { integration_id: 9 }, {})
    expect(post).toHaveBeenNthCalledWith(2, '/api/chats/4/messages', { content: 'Покажи продажи' }, {})
    expect(deleteRequest).toHaveBeenCalledWith('/api/chats/4', {})
  })

  it.each([401, 403, 409, 422, 429, 502])('passes HTTP %s through without retrying mutations', async (status) => {
    const error = new ApiError('Request failed', { kind: 'http', status })
    const post = vi.fn().mockRejectedValue(error)
    const gateway = createHttpChatGateway({ post } as unknown as ApiClient)

    await expect(gateway.sendMessage(4, { content: 'Повтори' })).rejects.toBe(error)
    expect(post).toHaveBeenCalledTimes(1)
  })
})
