import { AlertCircle, LoaderCircle } from 'lucide-react'
import { Dialog, DialogContent } from '../../../shared/ui/dialog'
import type { MonthCloseDetailsState } from '../application/month-close-store'

export function MonthCloseDetailsDialog({ state, title, onClose }: {
  state: MonthCloseDetailsState
  title: string
  onClose: () => void
}) {
  if (state.status === 'idle') return null

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent size="wide" title={title} description="Документы 1С, которые требуют внимания перед закрытием месяца." testId="month-close-details">
        {state.status === 'loading' && <div className="month-close-dialog-state"><LoaderCircle className="month-close-spinner" /><span>Получаем документы…</span></div>}
        {state.status === 'error' && <div className="month-close-dialog-state month-close-dialog-error"><AlertCircle /><span>{state.error.message}</span></div>}
        {state.status === 'success' && state.value.items.length === 0 && <div className="month-close-dialog-state"><span>Проблемных документов нет.</span></div>}
        {state.status === 'success' && state.value.items.length > 0 && (
          <div className="month-close-detail-list">
            {state.value.items.map((item) => (
              <article className="month-close-detail" key={`${item.entity}-${item.refKey}`}>
                <div><strong>{item.entityLabel}</strong><span>{item.number ? `№ ${item.number}` : 'Без номера'}{item.date ? ` · ${item.date}` : ''}</span></div>
                <p>{item.message}</p>
                {item.amount !== null && <small>Сумма документа: {new Intl.NumberFormat('ru-RU').format(item.amount)}</small>}
              </article>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
