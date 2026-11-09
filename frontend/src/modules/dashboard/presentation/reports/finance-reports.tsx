import { motion, useReducedMotion } from 'motion/react'
import type { DashboardReport } from '../../domain/dashboard-report'
import { FinanceChart } from '../charts/finance-chart'
import { ReportDetails } from './report-details'
import { dashboardCardMotion, getDashboardCardTransition } from './dashboard-motion'

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
    description: 'Выручка минус расходы · ₽',
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
  {
    key: 'vat',
    title: 'НДС к начислению',
    description: 'Расчётный НДС по реализациям · ₽',
    color: '#e36d58',
    variant: 'bar',
  },
  {
    key: 'receivables',
    title: 'Дебиторская задолженность',
    description: 'Динамика задолженности покупателей · ₽',
    color: '#3478d4',
    variant: 'line',
  },
  {
    key: 'payables',
    title: 'Кредиторская задолженность',
    description: 'Обязательства перед поставщиками · ₽',
    color: '#8e6cc8',
    variant: 'line',
  },
  {
    key: 'cashBalance',
    title: 'Остаток денежных средств',
    description: 'Динамика доступного остатка · ₽',
    color: '#25866c',
    variant: 'line',
  },
] as const

export function FinanceReports({ report }: { report: DashboardReport }) {
  const reducedMotion = useReducedMotion()
  return financeViews.map((view) => (
    <motion.article
      className="dashboard-report"
      key={view.key}
      data-testid={`finance-report-${view.key}`}
      initial={reducedMotion ? dashboardCardMotion.reducedInitial : dashboardCardMotion.initial}
      animate={dashboardCardMotion.animate}
      transition={getDashboardCardTransition(Boolean(reducedMotion), financeViews.indexOf(view) + 6)}
      whileHover={reducedMotion ? undefined : dashboardCardMotion.hover}
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
    </motion.article>
  ))
}
