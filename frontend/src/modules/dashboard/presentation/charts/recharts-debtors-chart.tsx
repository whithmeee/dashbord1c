import { useState } from 'react'
import { useReducedMotion } from 'motion/react'
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from 'recharts'
import type { ReportPoint } from '../../domain/dashboard-report'
import { formatMoney, unavailableMark } from '../reports/money-format'
import {
  createDebtorsDoughnutData,
  getDebtorsDoughnutAnimation,
} from './recharts-debtors-chart-config'
import './report-charts.css'

function DebtorsTooltip({
  active,
  payload,
  masked,
}: TooltipContentProps & { masked: boolean }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="dashboard-recharts-tooltip">
      <span>{item.name}</span>
      <strong>{masked ? unavailableMark : formatMoney(Number(item.value ?? 0))}</strong>
    </div>
  )
}

export function RechartsDebtorsDoughnut({
  points,
  masked = false,
  centerLabel = 'общий долг',
  ariaLabel = 'Распределение задолженности пяти крупнейших должников',
}: {
  points: ReportPoint[]
  masked?: boolean
  centerLabel?: string
  ariaLabel?: string
}) {
  const reducedMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const data = createDebtorsDoughnutData(points)
  const animation = getDebtorsDoughnutAnimation(Boolean(reducedMotion))

  return (
    <div
      className="dashboard-chart dashboard-chart-recharts-doughnut"
      data-testid="recharts-debtors-chart"
      role="img"
      aria-label={ariaLabel}
    >
      <div className="dashboard-debt-center">
        <strong>{new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 2 }).format(points.reduce((sum, point) => sum + point.amount, 0))}</strong>
        <span>{centerLabel}</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="43%"
            innerRadius="56%"
            outerRadius="76%"
            paddingAngle={2}
            {...animation}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={entry.fill}
                fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.68}
                stroke="var(--app-panel-solid)"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={(props) => <DebtorsTooltip {...props} masked={masked} />} />
          <Legend
            verticalAlign="bottom"
            height={32}
            iconType="circle"
            wrapperStyle={{ fontSize: 11, color: 'var(--app-muted)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
