import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
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
  const dialogContent = (
    <>
      <DialogPrimitive.Overlay className="cabinet-dialog-overlay" />
      <DialogPrimitive.Content
        className={`cabinet-dialog cabinet-dialog-${size}`}
        data-testid={testId}
      >
        <header className="cabinet-dialog-header">
          <DialogPrimitive.Title asChild>
            <h2>{title}</h2>
          </DialogPrimitive.Title>
          <button className="cabinet-dialog-close" type="button" aria-label="Закрыть" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="cabinet-dialog-body">{children}</div>
      </DialogPrimitive.Content>
    </>
  )

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      {typeof document === 'undefined' ? dialogContent : <DialogPrimitive.Portal>{dialogContent}</DialogPrimitive.Portal>}
    </DialogPrimitive.Root>
  )
}
