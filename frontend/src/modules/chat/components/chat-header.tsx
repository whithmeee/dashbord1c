import { MessageCircleMore, MoreHorizontal } from 'lucide-react'

export function ChatHeader() {
  return (
    <header className="chat-header">
      <div className="chat-heading">
        <span className="chat-heading-icon">
          <MessageCircleMore size={18} />
        </span>
        <span>
          <strong>Новый диалог</strong>
          <small>Ассистент готов помочь</small>
        </span>
      </div>
      <button className="chat-icon-button" type="button" aria-label="Меню чата">
        <MoreHorizontal size={20} />
      </button>
    </header>
  )
}
