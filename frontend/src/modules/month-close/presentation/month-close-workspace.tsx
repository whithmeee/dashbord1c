import { CalendarCheck2, Database, FileWarning, RefreshCw } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Select } from '../../../shared/ui/select'
import type { MonthCloseDetailsState } from '../application/month-close-store'
import type { MonthCloseSummary } from '../domain/month-close'
import { MonthCloseChecks } from './month-close-checks'
import { MonthCloseDetailsDialog } from './month-close-details-dialog'

type IntegrationOption = { readonly id: number; readonly name: string }

export function MonthCloseWorkspace({ summary, integrations, integrationId, month, scanning, progress, details, onIntegrationChange, onMonthChange, onScan, onOpenCheck, onCloseDetails }: {
  summary: MonthCloseSummary
  integrations: readonly IntegrationOption[]
  integrationId: number
  month: string
  scanning: boolean
  progress: number
  details: MonthCloseDetailsState
  onIntegrationChange: (id: number) => void
  onMonthChange: (month: string) => void
  onScan: () => void
  onOpenCheck: (check: string) => void
  onCloseDetails: () => void
}) {
  const detailKey = details.status === 'success' ? details.value.check : details.status === 'idle' ? '' : details.check
  const detailTitle = summary.checks.find((check) => check.key === detailKey)?.label ?? 'Результаты проверки'

  return (
    <section className="month-close-page" data-testid="month-close-page">
      <header className="month-close-heading">
        <div><span>1С · КОНТРОЛЬ ПЕРИОДА</span><h1>Помощник закрытия месяца</h1><p>Проверяем документы и заранее показываем, что требует внимания.</p></div>
        <div className="month-close-filters">
          <label>База 1С<Select ariaLabel="База 1С" value={String(integrationId)} options={integrations.map((item) => ({ value: String(item.id), label: item.name }))} onValueChange={(value) => onIntegrationChange(Number(value))} /></label>
          <label>Месяц<input type="month" value={month} onChange={(event) => onMonthChange(event.target.value)} /></label>
          <button className="cabinet-button cabinet-button-primary" type="button" disabled={scanning} onClick={onScan}><RefreshCw className={scanning ? 'month-close-spinner' : ''} size={17} />{scanning ? `Сканируем ${progress}%` : 'Сканировать'}</button>
        </div>
      </header>
      {scanning && <div className="month-close-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>}
      <section className="month-close-overview">
        <div className="month-close-readiness" style={{ '--month-close-angle': `${summary.readiness * 3.6}deg` } as CSSProperties}>
          <div><strong>{summary.readiness}%</strong><span>Готовность к закрытию</span></div>
        </div>
        <article><Database size={22} /><strong>{summary.documentsTotal}</strong><span>Документов проверено</span></article>
        <article><FileWarning size={22} /><strong>{summary.documentsFlagged}</strong><span>Требуют внимания</span></article>
        <article><CalendarCheck2 size={22} /><strong>{formatMonth(summary.month)}</strong><span>Проверяемый период</span></article>
      </section>
      <MonthCloseChecks checks={summary.checks} onOpen={onOpenCheck} />
      <MonthCloseDetailsDialog state={details} title={detailTitle} onClose={onCloseDetails} />
    </section>
  )
}

function formatMonth(value: string): string {
  const [year, month] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}
