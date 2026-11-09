import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import './cabinet-dialog.css'

export function CabinetDialog({
  title,
  testId,
  size = 'medium',
  onClose,
  children,
}: {
  title: string
  testId: string
  size?: 'medium' | 'large'
  onClose: () => void
  children: ReactNode
}) {
  const titleId = useId()
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeButton.current?.focus()

    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      previouslyFocused?.focus()
    }
  }, [onClose])

  return (
    <div
      className="cabinet-dialog-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className={`cabinet-dialog cabinet-dialog-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid={testId}
      >
        <header className="cabinet-dialog-header">
          <h2 id={titleId}>{title}</h2>
          <button
            ref={closeButton}
            className="cabinet-dialog-close"
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="cabinet-dialog-body">{children}</div>
      </div>
    </div>
  )
}
