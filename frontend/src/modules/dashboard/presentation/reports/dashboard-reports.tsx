import { FinanceReports } from './finance-reports'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowDownToLine, Landmark, TrendingUp, Wallet } from 'lucide-react'
import { RevenueChart, DebtorsChart } from '../charts/report-charts'
import { formatMoney } from './money-format'
import type { DashboardReport } from '../../domain/dashboard-report'
import { ReportDetails } from './report-details'
import './dashboard-reports.css'

export function DashboardReports({ report }: { report: DashboardReport }) {
  const reducedMotion = useReducedMotion()
  const cardTransition = reducedMotion
    ? { duration: 0.16 }
    : { duration: 0.24, ease: [0.23, 1, 0.32, 1] as const }
  return (
    <motion.div
      className="dashboard-reports"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.16 }}
    >
      <motion.article className="dashboard-metric" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...cardTransition, delay: reducedMotion ? 0 : 0.03 }}>
        <span className="dashboard-metric-icon">
          <TrendingUp size={20} />
        </span>
        <span>Выручка за период</span>
        <strong data-testid="revenue-total">
          {formatMoney(report.revenueTotal)}
        </strong>
        <small>Сумма по выбранным месяцам</small>
      </motion.article>
      <motion.article className="dashboard-metric" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...cardTransition, delay: reducedMotion ? 0 : 0.08 }}>
        <span className="dashboard-metric-icon">
          <Wallet size={20} />
        </span>
        <span>Долг топ-5 контрагентов</span>
        <strong data-testid="debt-total">
          {formatMoney(report.topFiveDebt)}
        </strong>
        <small>На {report.debtAsOf} · не зависит от периода выручки</small>
      </motion.article>
      <motion.article className="dashboard-metric" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...cardTransition, delay: reducedMotion ? 0 : 0.13 }}>
        <span className="dashboard-metric-icon"><ArrowDownToLine size={20} /></span>
        <span>Расходы за период</span>
        <strong>{formatMoney(report.expenses.reduce((sum, point) => sum + point.amount, 0))}</strong>
        <small>Операционные затраты</small>
      </motion.article>
      <motion.article className="dashboard-metric" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...cardTransition, delay: reducedMotion ? 0 : 0.18 }}>
        <span className="dashboard-metric-icon"><Landmark size={20} /></span>
        <span>Остаток денежных средств</span>
        <strong>{formatMoney(report.cashBalance.at(-1)?.amount ?? 0)}</strong>
        <small>На конец выбранного периода</small>
      </motion.article>
      <article className="dashboard-report">
        <header>
          <h2>Динамика выручки</h2>
          <p>По месяцам · ₽</p>
        </header>
        <RevenueChart points={report.revenue} />
        <ReportDetails points={report.revenue} label="Выручка по месяцам" />
      </article>
      <article className="dashboard-report">
        <header>
          <h2>Топ-5 должников</h2>
          <p>Задолженность на {report.debtAsOf} · ₽</p>
        </header>
        <DebtorsChart points={report.debtors} />
        <ReportDetails
          points={report.debtors}
          label="Задолженность контрагентов"
        />
      </article>
      <FinanceReports report={report} />
    </motion.div>
  )
}
