import { useState, type FormEvent } from 'react'
import type { Chat } from '../domain/chat'
import { Dialog, DialogClose, DialogContent, DialogFooter } from '../../../shared/ui/dialog'
import '../styles/chat-action-dialogs.css'

type ChatDialogProps = {
  chat: Chat
  onClose: () => void
  onConfirm: (value?: string) => void | Promise<void>
}

export function RenameChatDialog({ chat, onClose, onConfirm }: ChatDialogProps) {
  const [title, setTitle] = useState(chat.title)
  const [pending, setPending] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextTitle = title.trim()
    if (!nextTitle || pending) return
    setPending(true)
    await onConfirm(nextTitle)
    setPending(false)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent title="Переименовать диалог" description="Название поможет быстрее находить нужную переписку." testId="rename-chat-dialog">
        <form className="chat-action-form" onSubmit={(event) => void submit(event)}>
          <label htmlFor="chat-dialog-title">Название</label>
          <input id="chat-dialog-title" value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
          <DialogFooter>
            <DialogClose asChild><button className="chat-dialog-button" type="button" disabled={pending}>Отмена</button></DialogClose>
            <button className="chat-dialog-button chat-dialog-primary" type="submit" disabled={!title.trim() || pending}>{pending ? 'Сохраняем…' : 'Сохранить'}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteChatDialog({ chat, onClose, onConfirm }: ChatDialogProps) {
  const [pending, setPending] = useState(false)
  const confirm = async () => {
    if (pending) return
    setPending(true)
    await onConfirm()
    setPending(false)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent title="Удалить диалог?" description={`Диалог «${chat.title}» и его история будут удалены.`} role="alertdialog" testId="delete-chat-dialog">
        <DialogFooter>
          <DialogClose asChild><button className="chat-dialog-button" type="button" disabled={pending}>Отмена</button></DialogClose>
          <button className="chat-dialog-button chat-dialog-danger" type="button" disabled={pending} onClick={() => void confirm()}>{pending ? 'Удаляем…' : 'Удалить'}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
