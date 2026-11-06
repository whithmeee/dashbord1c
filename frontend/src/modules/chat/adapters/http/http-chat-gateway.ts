import { api, type ApiClient, type RequestOptions } from '../../../../shared/api'
import { mapChat, mapChats, mapMessage, mapMessageRequestStatus, mapMessages } from '../../domain/chat-mapper'
import type { Chat, ChatMessage, ChatMessageRequestStatus, CreateChatInput, SendMessageInput, UpdateChatInput } from '../../domain/chat'

export interface ChatGateway {
  listChats(options?: RequestOptions): Promise<readonly Chat[]>
  createChat(input: CreateChatInput, options?: RequestOptions): Promise<Chat>
  updateChat(id: number, input: UpdateChatInput, options?: RequestOptions): Promise<Chat>
  deleteChat(id: number, options?: RequestOptions): Promise<void>
  listMessages(chatId: number, options?: RequestOptions): Promise<readonly ChatMessage[]>
  sendMessage(chatId: number, input: SendMessageInput, options?: RequestOptions): Promise<ChatMessage>
  getMessageRequestStatus(chatId: number, requestId: string, options?: RequestOptions): Promise<ChatMessageRequestStatus>
}

export function createHttpChatGateway(client: ApiClient): ChatGateway {
  return {
    async listChats(options = {}): Promise<readonly Chat[]> {
      return mapChats(await client.get<unknown>('/api/chats', options))
    },

    async createChat(input, options = {}): Promise<Chat> {
      return mapChat(await client.post<unknown>('/api/chats', toChatRequest(input), options))
    },

    async updateChat(id, input, options = {}): Promise<Chat> {
      return mapChat(await client.patch<unknown>(`/api/chats/${id}`, toChatRequest(input), options))
    },

    async deleteChat(id, options = {}): Promise<void> {
      await client.delete(`/api/chats/${id}`, options)
    },

    async listMessages(chatId, options = {}): Promise<readonly ChatMessage[]> {
      return mapMessages(await client.get<unknown>(`/api/chats/${chatId}/messages`, options))
    },

    async sendMessage(chatId, input, options = {}): Promise<ChatMessage> {
      return mapMessage(await client.post<unknown>(`/api/chats/${chatId}/messages`, input, options))
    },

    async getMessageRequestStatus(chatId, requestId, options = {}): Promise<ChatMessageRequestStatus> {
      return mapMessageRequestStatus(await client.get<unknown>(`/api/chats/${chatId}/message-requests/${requestId}`, options))
    },
  }
}

function toChatRequest(input: CreateChatInput | UpdateChatInput): Record<string, unknown> {
  return {
    ...(input.integrationId === undefined ? {} : { integration_id: input.integrationId }),
    ...(input.title === undefined ? {} : { title: input.title }),
  }
}

export const chatGateway = createHttpChatGateway(api)
