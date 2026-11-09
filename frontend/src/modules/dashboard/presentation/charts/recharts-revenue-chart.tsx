import { useReducedMotion } from 'motion/react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import type { ReportPoint } from '../../domain/dashboard-report'
import { formatAxisMoney, formatMoney } from '../reports/money-format'
import {
  createRevenueAreaData,
  getRevenueAreaAnimation,
} from './recharts-revenue-chart-config'
import './report-charts.css'

function RevenueTooltip({
  active,
  payload,
  label,
}: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const amount = Number(payload[0]?.value ?? 0)
  return (
    <div className="dashboard-recharts-tooltip">
      <span>{label}</span>
      <strong>{formatMoney(amount)}</strong>
    </div>
  )
}

export function RechartsRevenueArea({ points }: { points: ReportPoint[] }) {
  const reducedMotion = useReducedMotion()
  const animation = getRevenueAreaAnimation(Boolean(reducedMotion))
  const data = createRevenueAreaData(points)

  return (
    <div className="dashboard-chart dashboard-chart-recharts" data-testid="recharts-revenue-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenue-area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0071e3" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#0071e3" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--app-border)" strokeDasharray="3 4" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--app-muted)', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--app-muted)', fontSize: 11 }}
            tickFormatter={(value: number) => formatAxisMoney(value)}
            width={48}
          />
          <Tooltip
            content={RevenueTooltip}
            cursor={{ stroke: '#0071e3', strokeDasharray: '4 4', strokeOpacity: 0.45 }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            name="Выручка"
            stroke="#0071e3"
            strokeWidth={2.5}
            fill="url(#revenue-area-gradient)"
            dot={{ r: 3, fill: '#0071e3', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#ffffff', stroke: '#0071e3', strokeWidth: 2 }}
            {...animation}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
