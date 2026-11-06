import type { ApiError } from '../../../shared/api'
import type { Chat, ChatMessage } from '../domain/chat'

export type ChatListState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly items: readonly Chat[] }
  | { readonly status: 'error'; readonly error: Error }

export type ChatMessagesState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly chatId: number }
  | { readonly status: 'success'; readonly chatId: number; readonly items: readonly ChatMessage[] }
  | { readonly status: 'error'; readonly chatId: number; readonly error: Error }

export type ChatSendingState =
  | { readonly status: 'idle' }
  | { readonly status: 'sending' }
  | { readonly status: 'error'; readonly error: Error }

export type ChatMutationState =
  | { readonly status: 'idle' }
  | { readonly status: 'pending'; readonly operation: 'create' | 'update' | 'delete'; readonly chatId?: number }
  | {
      readonly status: 'error'
      readonly operation: 'create' | 'update' | 'delete'
      readonly chatId?: number
      readonly error: Error
      readonly validationErrors?: ApiError['validationErrors']
    }

export type ChatState = {
  readonly chats: ChatListState
  readonly selectedChatId?: number
  readonly messages: ChatMessagesState
  readonly sending: ChatSendingState
  readonly mutation: ChatMutationState
}
