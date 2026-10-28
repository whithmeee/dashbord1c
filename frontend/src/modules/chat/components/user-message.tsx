import type { ChatMessage } from '../model/chat-message'

type UserMessageProps = {
  message: ChatMessage
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <article className="chat-message chat-message-user">
      <p>{message.text}</p>
    </article>
  )
}
