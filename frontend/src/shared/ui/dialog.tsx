import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import './dialog.css'

export const Dialog = DialogPrimitive.Root
export const DialogClose = DialogPrimitive.Close

export function DialogContent({
  title,
  description,
  role = 'dialog',
  testId,
  children,
}: {
  title: string
  description: string
  role?: 'dialog' | 'alertdialog'
  testId?: string
  children: ReactNode
}) {
  const content = (
    <>
      <DialogPrimitive.Overlay className="ui-dialog-overlay" />
      <DialogPrimitive.Content
        className="ui-dialog-content"
        data-testid={testId}
        role={role}
        aria-modal="true"
      >
        <DialogHeader>
          <div>
            <DialogPrimitive.Title className="ui-dialog-title">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="ui-dialog-description">
              {description}
            </DialogPrimitive.Description>
          </div>
          <DialogPrimitive.Close className="ui-dialog-close" aria-label="Закрыть">
            <X size={18} aria-hidden="true" />
          </DialogPrimitive.Close>
        </DialogHeader>
        {children}
      </DialogPrimitive.Content>
    </>
  )

  return typeof document === 'undefined'
    ? content
    : <DialogPrimitive.Portal>{content}</DialogPrimitive.Portal>
}

export function DialogHeader({ children, ...props }: ComponentProps<'header'>) {
  return <header className="ui-dialog-header" {...props}>{children}</header>
}

export function DialogFooter({ children, ...props }: ComponentProps<'footer'>) {
  return <footer className="ui-dialog-footer" {...props}>{children}</footer>
}
