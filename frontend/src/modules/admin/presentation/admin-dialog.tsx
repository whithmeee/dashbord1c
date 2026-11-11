import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

export function AdminDialog({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  busy?: boolean
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="admin-overlay" />
        <Dialog.Content
          className="admin-dialog"
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault()
          }}
          onPointerDownOutside={(event) => {
            if (busy) event.preventDefault()
          }}
        >
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>Управление данными Osminog</Dialog.Description>
          <button
            className="admin-close"
            aria-label="Закрыть"
            onClick={onClose}
            disabled={busy}
          >
            ×
          </button>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
