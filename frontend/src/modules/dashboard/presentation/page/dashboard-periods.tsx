import type { DashboardPeriod } from '../../domain/dashboard-report'

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
  return (
    <div className="dashboard-toolbar">
      <div>
        <strong>Период выручки</strong>
      </div>
      <div
        className="dashboard-periods"
        role="group"
        aria-label="Период выручки"
      >
        {Object.values(periods).map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === period}
            onClick={() => onSelectPeriod(item.id)}
            data-testid={`period-${item.id}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
