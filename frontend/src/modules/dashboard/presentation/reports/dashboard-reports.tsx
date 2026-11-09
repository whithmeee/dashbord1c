import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { ArrowDownToLine, Landmark, TrendingUp, Wallet } from 'lucide-react'
import { RechartsDebtorsDoughnut } from '../charts/recharts-debtors-chart'
import { RechartsCashLine, RechartsExpensesBar } from '../charts/recharts-finance-charts'
import { RechartsRevenueArea } from '../charts/recharts-revenue-chart'
import type { DashboardReport } from '../../domain/dashboard-report'
import { ReportDetails } from './report-details'
import './dashboard-reports.css'
import { dashboardCardMotion, getDashboardCardTransition } from './dashboard-motion'
import { AnimatedMetricValue } from './animated-metric-value'

export function DashboardReports({ report }: { report: DashboardReport }) {
  const reducedMotion = useReducedMotion()
  const [openDetails, setOpenDetails] = useState<string | null>(null)
  const cardProps = (index: number) => ({
    initial: reducedMotion ? dashboardCardMotion.reducedInitial : dashboardCardMotion.initial,
    animate: dashboardCardMotion.animate,
    transition: getDashboardCardTransition(Boolean(reducedMotion), index),
    whileHover: reducedMotion ? undefined : dashboardCardMotion.hover,
  })
  return (
    <motion.div
      className="dashboard-reports"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.16 }}
    >
      <motion.article className="dashboard-metric" {...cardProps(0)}>
        <span className="dashboard-metric-icon">
          <TrendingUp size={20} />
        </span>
        <span>Выручка за период</span>
        <strong data-testid="revenue-total">
          <AnimatedMetricValue amount={report.revenueTotal} reducedMotion={Boolean(reducedMotion)} />
        </strong>
        <small>Сумма по выбранным месяцам</small>
      </motion.article>
      <motion.article className="dashboard-metric" {...cardProps(1)}>
        <span className="dashboard-metric-icon">
          <Wallet size={20} />
        </span>
        <span>Долг топ-5 контрагентов</span>
        <strong data-testid="debt-total">
          <AnimatedMetricValue amount={report.topFiveDebt} reducedMotion={Boolean(reducedMotion)} />
        </strong>
        <small>На {report.debtAsOf} · не зависит от периода выручки</small>
      </motion.article>
      <motion.article className="dashboard-metric" {...cardProps(2)}>
        <span className="dashboard-metric-icon"><ArrowDownToLine size={20} /></span>
        <span>Расходы за период</span>
        <strong>
          <AnimatedMetricValue
            amount={report.expenses.reduce((sum, point) => sum + point.amount, 0)}
            reducedMotion={Boolean(reducedMotion)}
          />
        </strong>
        <small>Операционные затраты</small>
      </motion.article>
      <motion.article className="dashboard-metric" {...cardProps(3)}>
        <span className="dashboard-metric-icon"><Landmark size={20} /></span>
        <span>Остаток денежных средств</span>
        <strong>
          <AnimatedMetricValue
            amount={report.cashBalance.at(-1)?.amount ?? 0}
            reducedMotion={Boolean(reducedMotion)}
          />
        </strong>
        <small>На конец выбранного периода</small>
      </motion.article>
      <motion.article className="dashboard-report dashboard-report-wide" {...cardProps(4)}>
        <header>
          <h2>Выручка по месяцам</h2>
          <p>По месяцам · ₽</p>
        </header>
        <RechartsRevenueArea points={report.revenue} />
        <ReportDetails
          points={report.revenue}
          label="Выручка по месяцам"
          open={openDetails === 'revenue'}
          onToggle={(open) => setOpenDetails(open ? 'revenue' : null)}
        />
      </motion.article>
      <motion.article className="dashboard-report dashboard-report-half" {...cardProps(5)}>
        <header>
          <h2>Распределение задолженности</h2>
          <p>Топ-5 контрагентов · ₽</p>
        </header>
        <RechartsDebtorsDoughnut points={report.debtors} />
        <ReportDetails
          points={report.debtors}
          label="Задолженность контрагентов"
          open={openDetails === 'debtors'}
          onToggle={(open) => setOpenDetails(open ? 'debtors' : null)}
        />
      </motion.article>
      <motion.article className="dashboard-report dashboard-report-balanced" {...cardProps(6)}>
        <header>
          <h2>Расходы по месяцам</h2>
          <p>Операционные затраты · ₽</p>
        </header>
        <RechartsExpensesBar points={report.expenses} />
        <ReportDetails
          points={report.expenses}
          label="Расходы по месяцам"
          open={openDetails === 'expenses'}
          onToggle={(open) => setOpenDetails(open ? 'expenses' : null)}
        />
      </motion.article>
      <motion.article className="dashboard-report dashboard-report-balanced" {...cardProps(7)}>
        <header>
          <h2>Остаток денежных средств</h2>
          <p>На конец месяца · ₽</p>
        </header>
        <RechartsCashLine points={report.cashBalance} />
        <ReportDetails
          points={report.cashBalance}
          label="Остаток денежных средств"
          open={openDetails === 'cash'}
          onToggle={(open) => setOpenDetails(open ? 'cash' : null)}
        />
      </motion.article>
    </motion.div>
  )
}
