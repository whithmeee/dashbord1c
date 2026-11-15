import { AlertCircle, LoaderCircle } from 'lucide-react'
import { Dialog, DialogContent } from '../../../shared/ui/dialog'
import type { ReceivablesDetailsState } from '../application/receivables-store'
import { formatMoney } from './receivables-format'

export function ReceivablesDetailsDialog({ state, title, onClose }: {
  state: ReceivablesDetailsState
  title: string
  onClose: () => void
}) {
  if (state.status === 'idle') return null

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent size="wide" title={title} description="Покупатели, расчёты с которыми требуют внимания за выбранный месяц." testId="receivables-details">
        {state.status === 'loading' && <div className="month-close-dialog-state"><LoaderCircle className="month-close-spinner" /><span>Получаем покупателей…</span></div>}
        {state.status === 'error' && <div className="month-close-dialog-state month-close-dialog-error"><AlertCircle /><span>{state.error.message}</span></div>}
        {state.status === 'success' && state.value.items.length === 0 && <div className="month-close-dialog-state"><span>Замечаний по покупателям нет.</span></div>}
        {state.status === 'success' && state.value.items.length > 0 && (
          <div className="month-close-detail-list">
            {state.value.items.map((item) => (
              <article className="month-close-detail" key={item.counterpartyKey}>
                <div><strong>{item.counterparty}</strong><span>Долг: {formatMoney(item.outstanding)}</span></div>
                <p>{item.message}</p>
                <small>Отгружено: {formatMoney(item.shipped)} · Оплачено: {formatMoney(item.paid)}</small>
              </article>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
