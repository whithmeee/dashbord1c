import { MessageCircleMore } from 'lucide-react'

type ChatHeaderProps = {
  title: string
  integrationName?: string
}

export function ChatHeader({ title, integrationName }: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <div className="chat-heading">
        <span className="chat-heading-icon">
          <MessageCircleMore size={18} />
        </span>
        <span>
          <strong>{title}</strong>
          <small>{integrationName ?? 'Выберите диалог или создайте новый'}</small>
        </span>
      </div>
    </header>
  )
}
