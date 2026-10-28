import type { RefObject } from 'react'
import type { ChatMessage } from '../model/chat-message'
import { AssistantMessage } from './assistant-message'
import { UserMessage } from './user-message'

type ChatMessageListProps = {
  conversationEndRef: RefObject<HTMLDivElement>
  messages: ChatMessage[]
}

export function ChatMessageList({
  conversationEndRef,
  messages,
}: ChatMessageListProps) {
  return (
    <div className="chat-conversation" aria-live="polite">
      <div className="chat-messages">
        <div className="chat-day-label">Сегодня</div>
        {messages.map((message) =>
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
