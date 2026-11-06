import { ApiError } from '../../../shared/api'
import type { ChatMessage as DomainChatMessage } from '../domain/chat'

export type ChatMessageAuthor = 'assistant' | 'user'

export type ChatMessage = {
  readonly id: string
  readonly author: ChatMessageAuthor
  readonly text: string
  readonly widget?: DomainChatMessage['widget']
}

export type ChatDraftDecision =
  | { kind: 'empty' }
  | { kind: 'ready'; text: string }

export function mapChatMessagesToView(messages: readonly DomainChatMessage[]): readonly ChatMessage[] {
  return messages.map((message) => ({
    id: String(message.id),
    author: message.role,
    text: message.content ?? '',
    ...(message.role === 'assistant' ? { widget: message.widget } : {}),
  }))
}

export function prepareChatDraft(draft: string): ChatDraftDecision {
  const text = draft.trim()
  return text ? { kind: 'ready', text } : { kind: 'empty' }
}

export function isChatDraftEmpty(draft: string): boolean {
  return prepareChatDraft(draft).kind === 'empty'
}

export function getChatErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : 'Проверьте соединение и попробуйте ещё раз.'
  }

  switch (error.status) {
    case 401:
      return 'Сессия завершена. Войдите снова.'
    case 403:
      return 'У вас нет доступа к этому чату.'
    case 409:
      return 'Выбранная база 1С отключена. Выберите другую базу.'
    case 422:
      return 'Проверьте данные запроса.'
    case 429:
      return 'Слишком много запросов. Попробуйте позже.'
    case 502:
      return 'DeepSeek или 1С временно недоступны. Обновите историю позже.'
    default:
      return error.kind === 'network' ? 'Нет связи с сервером. Обновите историю позже.' : error.message
  }
}
