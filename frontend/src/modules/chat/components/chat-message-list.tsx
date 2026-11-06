import type { RefObject } from 'react'
import type { ChatMessage } from '../model/chat-message'
import { getChatErrorMessage } from '../model/chat-view-model'
import { AssistantMessage } from './assistant-message'
import { UserMessage } from './user-message'

type ChatMessageListProps = {
  conversationEndRef: RefObject<HTMLDivElement>
  messages: readonly ChatMessage[]
  status: 'idle' | 'loading' | 'success' | 'error'
  error?: Error
  onRefresh: () => void
}

export function ChatMessageList({
  conversationEndRef,
  messages,
  status,
  error,
  onRefresh,
}: ChatMessageListProps) {
  return (
    <div className="chat-conversation" aria-live="polite">
      <div className="chat-messages">
        <div className="chat-day-label">Сегодня</div>
        {status === 'loading' && <p className="chat-state-message">Загружаем историю…</p>}
        {status === 'idle' && <p className="chat-state-message">Выберите диалог, чтобы открыть историю.</p>}
        {status === 'error' && (
          <div className="chat-state-message">
            <p>{getChatErrorMessage(error)}</p>
            <button type="button" className="chat-refresh-button" onClick={onRefresh}>Обновить историю</button>
          </div>
        )}
        {status === 'success' && messages.length === 0 && <p className="chat-state-message">В этом диалоге пока нет сообщений.</p>}
        {status === 'success' && messages.map((message) =>
          message.author === 'assistant' ? (
            <AssistantMessage message={message} key={message.id} />
          ) : (
            <UserMessage message={message} key={message.id} />
          ),
        )}
        <div ref={conversationEndRef} />
      </div>
    </div>
  )
}
