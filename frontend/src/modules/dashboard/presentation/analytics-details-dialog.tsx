import { Dialog, DialogContent } from '../../../shared/ui/dialog'
import type { SalesReport } from '../domain/financial-sales'
import { useSalesDocuments } from '../react/use-sales-documents'

export type AnalyticsDetailKind = 'total' | 'documents' | 'customers' | 'organizations'

export function AnalyticsDetailsDialog({ kind, report, onClose }: {
  kind: AnalyticsDetailKind | null
  report: SalesReport
  onClose(): void
}) {
  const documents = useSalesDocuments(kind === 'documents' && report.period && report.money.currencyKey ? {
    integrationId: report.integrationId,
    from: report.period.from,
    to: report.period.to,
    currencyKey: report.money.currencyKey,
  } : undefined)

  return (
    <Dialog open={kind !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      {kind && (
        <DialogContent title={title(kind)} description={description(kind, report)} testId="analytics-details-dialog">
          <div className="analytics-details-body">
            {kind === 'total' && <AmountRows items={report.monthly.map((item) => ({ name: month(item.period), amount: item.amount, documentCount: item.documentCount }))} currency={report.money.currency} />}
            {kind === 'customers' && <AmountRows items={report.customers} currency={report.money.currency} />}
            {kind === 'organizations' && <AmountRows items={report.organizations} currency={report.money.currency} />}
            {kind === 'documents' && <Documents state={documents} currency={report.money.currency} />}
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}

function Documents({ state, currency }: {
  state: ReturnType<typeof useSalesDocuments>
  currency: string | null
}) {
  if (state.status === 'idle') return null
  if (state.status === 'loading') return <p role="status">Загружаем документы из 1С…</p>
  if (state.status === 'error') return <p role="alert">Не удалось загрузить документы.</p>
  if (state.page.items.length === 0) return <p>Документы за выбранный период не найдены.</p>
  return (
    <>
      <p className="analytics-details-count">Найдено документов: {state.page.pagination.total}</p>
      <ul className="analytics-details-list">
        {state.page.items.map((item) => (
          <li key={item.id}>
            <div><strong>{item.customer.name}</strong><span>{item.organization.name} · {date(item.date)}</span></div>
            <b>{amount(item.amount)} {currency}</b>
          </li>
        ))}
      </ul>
    </>
  )
}

function AmountRows({ items, currency }: {
  items: readonly { name?: string; amount: number; documentCount: number }[]
  currency: string | null
}) {
  return (
    <ul className="analytics-details-list">
      {items.map((item, index) => (
        <li key={`${item.name ?? index}-${index}`}>
          <div><strong>{item.name ?? 'Период'}</strong><span>{item.documentCount} док.</span></div>
          <b>{amount(item.amount)} {currency}</b>
        </li>
      ))}
    </ul>
  )
}

function title(kind: AnalyticsDetailKind) {
  return { total: 'Сумма реализаций', documents: 'Проведённые реализации', customers: 'Покупатели', organizations: 'Организации' }[kind]
}
function description(kind: AnalyticsDetailKind, report: SalesReport) {
  const period = report.period ? `${date(report.period.from)} — ${date(report.period.to)}` : 'Выбранный период'
  return kind === 'documents' ? `Документы 1С за период ${period}` : `Детализация показателя за период ${period}`
}
function amount(value: number) { return value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function date(value: string) { return new Intl.DateTimeFormat('ru-RU').format(new Date(value.length === 10 ? `${value}T00:00:00Z` : value)) }
function month(value: string) { return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(`${value}-01T00:00:00Z`)) }
