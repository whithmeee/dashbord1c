import { motion, useReducedMotion } from 'motion/react'
import { TrendingUp, Wallet } from 'lucide-react'
import { RevenueChart, DebtorsChart } from '../charts/report-charts'
import { formatMoney } from './money-format'
import type { DashboardReport } from '../../domain/dashboard-report'
import { ReportDetails } from './report-details'
import './dashboard-reports.css'

export function DashboardReports({ report }: { report: DashboardReport }) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      className="dashboard-reports"
      initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.35 }}
    >
      <article className="dashboard-metric">
        <span className="dashboard-metric-icon">
          <TrendingUp size={20} />
        </span>
        <span>Выручка за период</span>
        <strong data-testid="revenue-total">
          {formatMoney(report.revenueTotal)}
        </strong>
        <small>Сумма по выбранным месяцам</small>
      </article>
      <article className="dashboard-metric">
        <span className="dashboard-metric-icon">
          <Wallet size={20} />
        </span>
        <span>Долг топ-5 контрагентов</span>
        <strong data-testid="debt-total">
          {formatMoney(report.topFiveDebt)}
        </strong>
        <small>На {report.debtAsOf} · не зависит от периода выручки</small>
      </article>
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
    </motion.div>
  )
}
