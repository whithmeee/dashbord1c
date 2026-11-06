import { Sparkles } from 'lucide-react'
import type { ChatMessage } from '../model/chat-message'
import { ChatWidgetTable } from './chat-widget-table'

type AssistantMessageProps = {
  message: ChatMessage
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  return (
    <article className="chat-message chat-message-assistant">
      <span className="chat-assistant-avatar">
        <Sparkles size={17} />
      </span>
      <div className="chat-message-content">
        <strong>Ассистент</strong>
        <p>{message.text}</p>
        {message.widget && <ChatWidgetTable widget={message.widget} />}
      </div>
    </article>
  )
}
