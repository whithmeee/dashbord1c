import type { FormEvent, KeyboardEvent } from 'react'
import { ArrowUp, Paperclip } from 'lucide-react'
import { getChatErrorMessage } from '../model/chat-view-model'

type ChatComposerProps = {
  draft: string
  isSendDisabled: boolean
  isSending: boolean
  sendError?: Error
  operationStatus?: 'processing' | 'unknown'
  onRefresh: () => void
  onCheckStatus: () => void
  onDraftChange: (draft: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ChatComposer({
  draft,
  isSendDisabled,
  isSending,
  sendError,
  operationStatus,
  onRefresh,
  onCheckStatus,
  onDraftChange,
  onKeyDown,
  onSubmit,
}: ChatComposerProps) {
  return (
    <footer className="chat-composer-area">
      {sendError && <div className="chat-send-error" role="alert">
        <span>{getChatErrorMessage(sendError)}</span>
        {operationStatus && <button type="button" onClick={onCheckStatus}>Проверить статус</button>}
        <button type="button" onClick={onRefresh}>Обновить историю</button>
      </div>}
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
            aria-busy={isSending}
          >
            {isSending ? '…' : <ArrowUp size={19} />}
          </button>
        </div>
      </form>
      <p className="chat-disclaimer">
        ИИ может допускать ошибки. Проверяйте важную информацию.
      </p>
    </footer>
  )
}
