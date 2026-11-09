import { motion, useReducedMotion } from 'motion/react'
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
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, transform: 'translateY(12px)' }}
      animate={{ opacity: 1, transform: 'translateY(0)' }}
      transition={{ duration: reducedMotion ? 0.16 : 0.24, ease: [0.23, 1, 0.32, 1], delay: reducedMotion ? 0 : financeViews.indexOf(view) * 0.05 }}
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
