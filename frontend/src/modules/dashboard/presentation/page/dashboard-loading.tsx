import type { DashboardState } from './dashboard-state'
import './dashboard-loading.css'

const displayedPeriods = {
  quarter: 'август — октябрь 2026',
  'half-year': 'май — октябрь 2026',
}

export function DashboardUpdateStatus({ state }: { state: DashboardState }) {
  return (
    <div
      className="dashboard-update-status"
      role="status"
      data-testid="dashboard-update-status"
    >
      {state.status === 'ready' &&
        (state.refreshing
          ? `Обновляем… Показаны предыдущие данные: ${displayedPeriods[state.displayedPeriod]}.`
          : `Показаны данные: ${displayedPeriods[state.displayedPeriod]}.`)}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div role="status" data-testid="dashboard-skeleton">
      <span className="dashboard-loading-label">Загружаем статистику…</span>
      <div className="dashboard-reports" aria-hidden="true">
        {[0, 1].map((key) => (
          <div className="dashboard-skeleton-metric" key={key}>
            <span />
            <strong />
            <span />
          </div>
        ))}
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <div className="dashboard-skeleton-chart" key={key}>
            <span />
            <div />
          </div>
        ))}
      </div>
    </div>
  )
}
