import type { FormEvent, KeyboardEvent } from 'react'
import { ArrowUp, Paperclip } from 'lucide-react'

type ChatComposerProps = {
  draft: string
  isSendDisabled: boolean
  onDraftChange: (draft: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ChatComposer({
  draft,
  isSendDisabled,
  onDraftChange,
  onKeyDown,
  onSubmit,
}: ChatComposerProps) {
  return (
    <footer className="chat-composer-area">
      <form className="chat-composer" onSubmit={onSubmit}>
        <textarea
          aria-label="Сообщение"
          data-testid="chat-input"
          enterKeyHint="send"
          placeholder="Напишите сообщение..."
          rows={2}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="chat-composer-actions">
          <button className="chat-attachment-button" type="button">
            <Paperclip size={18} />
            <span>Прикрепить</span>
          </button>
          <button
            className="chat-send-button"
            type="submit"
            aria-label="Отправить сообщение"
            disabled={isSendDisabled}
          >
            <ArrowUp size={19} />
          </button>
        </div>
      </form>
      <p className="chat-disclaimer">
        ИИ может допускать ошибки. Проверяйте важную информацию.
      </p>
    </footer>
  )
}
