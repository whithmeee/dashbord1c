import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent } from '../../../shared/ui/dialog'
import type { SalesReport } from '../domain/financial-sales'
import { useSalesDocuments } from '../react/use-sales-documents'
import './analytics-details-dialog.css'

export type AnalyticsDetailKind = 'total' | 'documents' | 'customers' | 'organizations'

export function AnalyticsDetailsDialog({ kind, report, onClose }: {
  kind: AnalyticsDetailKind | null
  report: SalesReport
  onClose(): void
}) {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<{ customerKey?: string; organizationKey?: string; label: string } | null>(null)
  const showDocuments = kind === 'documents' || filter !== null
  useEffect(() => { setPage(1); setFilter(null) }, [kind])
  const documents = useSalesDocuments(showDocuments && report.period && report.money.currencyKey ? {
    integrationId: report.integrationId,
    from: report.period.from,
    to: report.period.to,
    currencyKey: report.money.currencyKey,
    customerKey: filter?.customerKey,
    organizationKey: filter?.organizationKey,
    page,
  } : undefined)

  return (
    <Dialog open={kind !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      {kind && (
        <DialogContent title={filter?.label ?? title(kind)} description={description(showDocuments, report)} testId="analytics-details-dialog">
          <div className="analytics-details-body">
            {filter && <button type="button" className="analytics-details-back" onClick={() => setFilter(null)}><ArrowLeft size={16} /> Назад к списку</button>}
            {!showDocuments && kind === 'total' && <AmountRows items={report.monthly.map((item) => ({ name: month(item.period), amount: item.amount, documentCount: item.documentCount }))} currency={report.money.currency} />}
            {!showDocuments && kind === 'customers' && <RankedRows items={report.customers} currency={report.money.currency} onSelect={(key, label) => setFilter({ customerKey: key, label })} />}
            {!showDocuments && kind === 'organizations' && <RankedRows items={report.organizations} currency={report.money.currency} onSelect={(key, label) => setFilter({ organizationKey: key, label })} />}
            {showDocuments && <Documents state={documents} currency={report.money.currency} onPage={setPage} />}
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}

function Documents({ state, currency, onPage }: {
  state: ReturnType<typeof useSalesDocuments>
  currency: string | null
  onPage(page: number): void
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
      <DocumentsPagination page={state.page.pagination.page} lastPage={state.page.pagination.lastPage} onPage={onPage} />
    </>
  )
}

export function DocumentsPagination({ page, lastPage, onPage }: { page: number; lastPage: number; onPage(page: number): void }) {
  if (lastPage <= 1) return null
  return (
    <nav className="analytics-details-pagination" aria-label="Страницы документов">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft size={16} /> Предыдущая</button>
      <span>Страница {page} из {lastPage}</span>
      <button type="button" disabled={page >= lastPage} onClick={() => onPage(page + 1)}>Следующая <ChevronRight size={16} /></button>
    </nav>
  )
}

function RankedRows({ items, currency, onSelect }: {
  items: readonly { key: string; name: string; amount: number; documentCount: number }[]
  currency: string | null
  onSelect(key: string, label: string): void
}) {
  return <ul className="analytics-details-list">{items.map((item) => (
    <li key={item.key}><button type="button" className="analytics-details-row" onClick={() => onSelect(item.key, item.name)}>
      <div><strong>{item.name}</strong><span>{item.documentCount} док. · показать документы</span></div><b>{amount(item.amount)} {currency}</b>
    </button></li>
  ))}</ul>
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
function description(documents: boolean, report: SalesReport) {
  const period = report.period ? `${date(report.period.from)} — ${date(report.period.to)}` : 'Выбранный период'
  return documents ? `Документы 1С за период ${period}` : `Детализация показателя за период ${period}`
}
function amount(value: number) { return value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function date(value: string) { return new Intl.DateTimeFormat('ru-RU').format(new Date(value.length === 10 ? `${value}T00:00:00Z` : value)) }
function month(value: string) { return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(`${value}-01T00:00:00Z`)) }
