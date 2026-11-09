import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmployeeDialog({
  title,
  description,
  testId,
  role = 'dialog',
  onClose,
  children,
}: {
  title: string
  description: string
  testId?: string
  role?: 'dialog' | 'alertdialog'
  onClose: () => void
  children: ReactNode
}) {
  const content = (
    <>
      <DialogPrimitive.Overlay className="employees-dialog-overlay" />
      <DialogPrimitive.Content className="employees-dialog-content" data-testid={testId} role={role} aria-modal="true">
        <header className="employees-modal-header">
          <div>
            <DialogPrimitive.Title asChild><h3>{title}</h3></DialogPrimitive.Title>
            <DialogPrimitive.Description asChild><p>{description}</p></DialogPrimitive.Description>
          </div>
          <DialogPrimitive.Close asChild>
            <button className="employees-icon-button" type="button" aria-label="Закрыть">
              <X size={18} aria-hidden="true" />
            </button>
          </DialogPrimitive.Close>
        </header>
        {children}
      </DialogPrimitive.Content>
    </>
  )

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      {typeof document === 'undefined' ? content : <DialogPrimitive.Portal>{content}</DialogPrimitive.Portal>}
    </DialogPrimitive.Root>
  )
}
