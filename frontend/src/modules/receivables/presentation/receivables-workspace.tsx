import { Banknote, HandCoins, RefreshCw, Users } from 'lucide-react'
import type { CSSProperties } from 'react'
import { MonthPicker } from '../../../shared/ui/calendar-field'
import { Select } from '../../../shared/ui/select'
import { MonthCloseChecks } from '../../month-close/presentation/month-close-checks'
import type { ReceivablesDetailsState } from '../application/receivables-store'
import type { ReceivablesSummary } from '../domain/receivables'
import { ReceivablesDetailsDialog } from './receivables-details-dialog'
import { formatMoney, formatMonth, paidShare } from './receivables-format'

type IntegrationOption = { readonly id: number; readonly name: string }

export function ReceivablesWorkspace({ summary, integrations, integrationId, month, scanning, progress, details, onIntegrationChange, onMonthChange, onScan, onOpenCheck, onCloseDetails }: {
  summary: ReceivablesSummary
  integrations: readonly IntegrationOption[]
  integrationId: number
  month: string
  scanning: boolean
  progress: number
  details: ReceivablesDetailsState
  onIntegrationChange: (id: number) => void
  onMonthChange: (month: string) => void
  onScan: () => void
  onOpenCheck: (check: string) => void
  onCloseDetails: () => void
}) {
  const detailKey = details.status === 'success' ? details.value.check : details.status === 'idle' ? '' : details.check
  const detailTitle = summary.checks.find((check) => check.key === detailKey)?.label ?? 'Контрагенты'

  return (
    <section className="month-close-page" data-testid="receivables-page">
      <header className="month-close-heading">
        <div><span>1С · РАСЧЁТЫ С ПОКУПАТЕЛЯМИ</span><h1>Контроль дебиторки</h1><p>Показываем, кто не оплатил отгрузки месяца и сколько нам должны.</p></div>
        <div className="month-close-filters">
          <label>База 1С<Select ariaLabel="База 1С" value={String(integrationId)} options={integrations.map((item) => ({ value: String(item.id), label: item.name }))} onValueChange={(value) => onIntegrationChange(Number(value))} /></label>
          <label>Месяц<MonthPicker ariaLabel="Месяц дебиторки" value={month} onValueChange={onMonthChange} /></label>
          <button className="cabinet-button cabinet-button-primary" type="button" disabled={scanning} onClick={onScan}><RefreshCw className={scanning ? 'month-close-spinner' : ''} size={17} />{scanning ? `Сканируем ${progress}%` : 'Сканировать'}</button>
        </div>
      </header>
      {scanning && <div className="month-close-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>}
      <section className="month-close-overview receivables-overview">
        <div className="month-close-readiness" style={{ '--month-close-angle': `${paidShare(summary) * 3.6}deg` } as CSSProperties}>
          <div><strong>{paidShare(summary)}%</strong><span>Оплачено от отгрузок</span></div>
        </div>
        <article><HandCoins size={22} /><strong>{formatMoney(summary.outstanding)}</strong><span>Задолженность покупателей</span></article>
        <article><Banknote size={22} /><strong>{formatMoney(summary.shipped)}</strong><span>Отгружено за {formatMonth(summary.month)}</span></article>
        <article><Banknote size={22} /><strong>{formatMoney(summary.paid)}</strong><span>Оплачено за месяц</span></article>
        <article><Users size={22} /><strong>{summary.debtorsTotal}</strong><span>Должников</span></article>
      </section>
      <MonthCloseChecks checks={summary.checks} onOpen={onOpenCheck} title="Что проверить по дебиторке" countLabel="Покупателей" />
      <ReceivablesDetailsDialog state={details} title={detailTitle} onClose={onCloseDetails} />
    </section>
  )
}
