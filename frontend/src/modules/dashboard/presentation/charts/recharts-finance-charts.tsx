import { useReducedMotion } from 'motion/react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import type { ReportPoint } from '../../domain/dashboard-report'
import { formatAxisMoney, formatMoney } from '../reports/money-format'
import {
  createFinanceChartData,
  getFinanceChartAnimation,
} from './recharts-finance-charts-config'
import './report-charts.css'

function FinanceTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="dashboard-recharts-tooltip">
      <span>{label}</span>
      <strong>{formatMoney(Number(payload[0]?.value ?? 0))}</strong>
    </div>
  )
}

function chartAxis() {
  return {
    axisLine: false,
    tickLine: false,
    tick: { fill: 'var(--app-muted)', fontSize: 11 },
    tickFormatter: (value: number) => formatAxisMoney(value),
  }
}

export function RechartsExpensesBar({ points }: { points: ReportPoint[] }) {
  const reducedMotion = useReducedMotion()
  const data = createFinanceChartData(points)
  return (
    <div className="dashboard-chart dashboard-chart-recharts-compact" data-testid="recharts-expenses-chart" role="img" aria-label="Расходы по месяцам">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--app-border)" strokeDasharray="3 4" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--app-muted)', fontSize: 11 }} />
          <YAxis {...chartAxis()} width={48} />
          <Tooltip content={FinanceTooltip} cursor={{ fill: 'var(--app-soft)' }} />
          <Bar dataKey="amount" name="Расходы" fill="#d68b20" radius={[6, 6, 0, 0]} maxBarSize={42} {...getFinanceChartAnimation(Boolean(reducedMotion))} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RechartsCashLine({ points }: { points: ReportPoint[] }) {
  const reducedMotion = useReducedMotion()
  const data = createFinanceChartData(points)
  return (
    <div className="dashboard-chart dashboard-chart-recharts-compact" data-testid="recharts-cash-chart" role="img" aria-label="Остаток денежных средств по месяцам">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--app-border)" strokeDasharray="3 4" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--app-muted)', fontSize: 11 }} />
          <YAxis {...chartAxis()} width={48} />
          <Tooltip content={FinanceTooltip} cursor={{ stroke: '#2a9d68', strokeDasharray: '4 4', strokeOpacity: 0.45 }} />
          <Line type="monotone" dataKey="amount" name="Остаток" stroke="#2a9d68" strokeWidth={2.5} dot={{ r: 3, fill: '#2a9d68', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#ffffff', stroke: '#2a9d68', strokeWidth: 2 }} {...getFinanceChartAnimation(Boolean(reducedMotion))} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
