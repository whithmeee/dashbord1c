import { useReducedMotion } from 'motion/react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import type { ReportPoint } from '../../domain/dashboard-report'
import { formatAxisMoney, formatMoney, unavailableMark } from '../reports/money-format'
import {
  createRankedBarData,
  getRankedBarAnimation,
  getRankedBarHeight,
} from './recharts-ranked-bars-config'
import './report-charts.css'

function RankedTooltip({ active, payload, masked }: TooltipContentProps & { masked: boolean }) {
  if (!active || !payload?.length) return null
  return (
    <div className="dashboard-recharts-tooltip">
      <span>{payload[0]?.payload.name}</span>
      <strong>{masked ? unavailableMark : formatMoney(Number(payload[0]?.value ?? 0))}</strong>
    </div>
  )
}

export function RechartsRankedBars({ points, masked = false, ariaLabel = 'Суммы по категориям' }: {
  points: ReportPoint[]
  masked?: boolean
  ariaLabel?: string
}) {
  const reducedMotion = useReducedMotion()
  const data = createRankedBarData(points)
  const height = getRankedBarHeight(points)

  return (
    <div className="dashboard-chart dashboard-chart-recharts-ranked" style={{ height }} data-testid="recharts-ranked-bars" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke="var(--app-border)" strokeDasharray="3 4" />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--app-muted)', fontSize: 11 }} tickFormatter={(value: number) => masked ? unavailableMark : formatAxisMoney(value)} />
          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--app-muted)', fontSize: 11 }} width={142} />
          <Tooltip content={(props) => <RankedTooltip {...props} masked={masked} />} cursor={{ fill: 'var(--app-soft)' }} />
          <Bar dataKey="value" fill="#2676d8" radius={[0, 6, 6, 0]} maxBarSize={24} {...getRankedBarAnimation(Boolean(reducedMotion))} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
