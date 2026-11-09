import type { DashboardPeriod } from '../../domain/dashboard-report'
import { LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { dashboardFilterMotion } from '../dashboard-filter-motion'

const periods: Record<DashboardPeriod, { id: DashboardPeriod; label: string }> =
  {
    quarter: {
      id: 'quarter',
      label: '3 месяца',
    },
    'half-year': {
      id: 'half-year',
      label: '6 месяцев',
    },
  }

export function DashboardPeriods({
  period,
  onSelectPeriod,
}: {
  period: DashboardPeriod
  onSelectPeriod: (period: DashboardPeriod) => void
}) {
  const reducedMotion = useReducedMotion()
  return (
    <div className="dashboard-toolbar">
      <div>
        <strong>Период выручки</strong>
      </div>
      <LayoutGroup id="dashboard-periods">
      <div className="dashboard-periods" role="group" aria-label="Период выручки">
        {Object.values(periods).map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === period}
            onClick={() => onSelectPeriod(item.id)}
            data-testid={`period-${item.id}`}
          >
            {item.id === period && (
              <motion.span
                layoutId={dashboardFilterMotion.layoutId}
                className="dashboard-period-selection"
                transition={reducedMotion ? { duration: 0 } : dashboardFilterMotion.transition}
                aria-hidden="true"
              />
            )}
            {item.label}
          </button>
        ))}
      </div>
      </LayoutGroup>
    </div>
  )
}
