import { useState, type ReactNode } from 'react'
import { Building2, FileCheck2, TrendingUp, Users } from 'lucide-react'
import type { MonthlyAmount, RankedAmount, SalesReport } from '../domain/financial-sales'
import { RechartsRevenueArea } from './charts/recharts-revenue-chart'
import { RechartsDebtorsDoughnut } from './charts/recharts-debtors-chart'
import { FinanceChart } from './charts/finance-chart'
import { ReportDetails } from './reports/report-details'
import { AnalyticsDetailsDialog, type AnalyticsDetailKind } from './analytics-details-dialog'

export function AnalyticsOverview({ report }: { report: SalesReport }) {
  const [detail, setDetail] = useState<AnalyticsDetailKind | null>(null)
  const currency = report.money.currency ?? ''
  const monthly = points(report.monthly)
  const customers = rankedPoints(report.customers)

  return (
    <div className="dashboard-reports">
      <Metric icon={<TrendingUp size={20} />} label="Сумма реализаций" value={`${formatAmount(report.totalAmount)} ${currency}`} note="Сумма документов в выбранной валюте" ariaLabel="Подробнее о сумме реализаций" onClick={() => setDetail('total')} />
      <Metric icon={<FileCheck2 size={20} />} label="Проведено реализаций" value={String(report.metrics.salesDocuments)} note="Без помеченных на удаление" ariaLabel="Подробнее о проведённых реализациях" onClick={() => setDetail('documents')} />
      <Metric icon={<Users size={20} />} label="Покупатели" value={String(report.metrics.customers)} note="По проведённым реализациям" ariaLabel="Подробнее о покупателях" onClick={() => setDetail('customers')} />
      <Metric icon={<Building2 size={20} />} label="Организации" value={String(report.metrics.organizations)} note="В выбранной валюте" ariaLabel="Подробнее об организациях" onClick={() => setDetail('organizations')} />
      <ReportCard title="Реализации по месяцам" description={`Сумма документов · ${currency}`} className="dashboard-report-wide" points={monthly}>
        <RechartsRevenueArea points={monthly} />
      </ReportCard>
      <ReportCard title="Покупатели по реализациям" description={`Топ покупателей · ${currency}`} className="dashboard-report-half" points={customers}>
        <RechartsDebtorsDoughnut points={customers} centerLabel="общая сумма" ariaLabel="Распределение суммы реализаций по покупателям" />
      </ReportCard>
      <AnalyticsDetailsDialog kind={detail} report={report} onClose={() => setDetail(null)} />
    </div>
  )
}

export function AnalyticsCatalog({ report }: { report: SalesReport }) {
  const currency = report.money.currency ?? ''
  const reports = realReports(report, currency)

  return (
    <div className="dashboard-reports financial-report-catalog" data-testid="real-report-catalog">
      {reports.map((item) => (
        <ReportCard key={item.key} title={item.title} description={item.description} points={item.points}>
          <FinanceChart points={item.points} label={item.title} color={item.color} variant={item.variant} />
        </ReportCard>
      ))}
    </div>
  )
}

function Metric({ icon, label, value, note, ariaLabel, onClick }: { icon: ReactNode; label: string; value: string; note: string; ariaLabel: string; onClick(): void }) {
  return <button type="button" className="dashboard-metric dashboard-metric-button" aria-label={ariaLabel} onClick={onClick}><span className="dashboard-metric-icon">{icon}</span><span>{label}</span><strong>{value}</strong><small>{note}</small></button>
}

function ReportCard({ title, description, points: reportPoints, className = '', children }: { title: string; description: string; points: { label: string; amount: number }[]; className?: string; children: ReactNode }) {
  return <article className={`dashboard-report ${className}`.trim()}><header><h2>{title}</h2><p>{description}</p></header>{children}<ReportDetails buttonLabel="Данные" points={reportPoints} label={title} /></article>
}

function realReports(report: SalesReport, currency: string) {
  return [
    { key: 'sales', title: 'Реализации по месяцам', description: `Сумма документов · ${currency}`, points: points(report.monthly), color: '#2676d8', variant: 'line' as const },
    { key: 'customers', title: 'Топ покупателей', description: `По сумме реализаций · ${currency}`, points: rankedPoints(report.customers), color: '#3478d4', variant: 'bar' as const },
    { key: 'organizations', title: 'Реализации по организациям', description: `По сумме документов · ${currency}`, points: rankedPoints(report.organizations), color: '#6861ce', variant: 'bar' as const },
    { key: 'receipts', title: 'Поступления на расчётный счёт', description: `Движение денег, не выручка · ${currency}`, points: points(report.receipts), color: '#25866c', variant: 'bar' as const },
    { key: 'payments', title: 'Списания с расчётного счёта', description: `Движение денег, не расходы · ${currency}`, points: points(report.payments), color: '#b76588', variant: 'bar' as const },
    { key: 'documents', title: 'Количество реализаций', description: 'Проведённые документы по месяцам', points: report.monthly.map((item) => ({ label: monthLabel(item.period), amount: item.documentCount })), color: '#d68b20', variant: 'bar' as const },
  ]
}

function points(items: readonly MonthlyAmount[]) { return items.map((item) => ({ label: monthLabel(item.period), amount: item.amount })) }
function rankedPoints(items: readonly RankedAmount[]) { return items.map((item) => ({ label: item.name, amount: item.amount })) }
function monthLabel(period: string) { return new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(new Date(`${period}-01T00:00:00Z`)).replace('.', '') }
function formatAmount(amount: number) { return amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
