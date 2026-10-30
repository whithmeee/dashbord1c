import type { DashboardReport } from '../../domain/dashboard-report'
import { FinanceChart } from '../charts/finance-chart'
import { ReportDetails } from './report-details'

const financeViews = [
  {
    key: 'expenses',
    title: 'Расходы',
    description: 'Признанные расходы по месяцам · ₽',
    color: '#d68b20',
    variant: 'bar',
  },
  {
    key: 'result',
    title: 'Финансовый результат',
    description: 'Демо: выручка минус расходы · ₽',
    color: '#25866c',
    variant: 'line',
  },
  {
    key: 'receipts',
    title: 'Поступления денег',
    description: 'Входящий денежный поток · ₽',
    color: '#6861ce',
    variant: 'bar',
  },
  {
    key: 'payments',
    title: 'Выплаты денег',
    description: 'Исходящий денежный поток · ₽',
    color: '#b76588',
    variant: 'bar',
  },
] as const

export function FinanceReports({ report }: { report: DashboardReport }) {
  return financeViews.map((view) => (
    <article
      className="dashboard-report"
      key={view.key}
      data-testid={`finance-report-${view.key}`}
    >
      <header>
        <h2>{view.title}</h2>
        <p>{view.description}</p>
      </header>
      <FinanceChart
        points={report[view.key]}
        label={view.title}
        color={view.color}
        variant={view.variant}
      />
      <ReportDetails points={report[view.key]} label={view.title} />
    </article>
  ))
}
