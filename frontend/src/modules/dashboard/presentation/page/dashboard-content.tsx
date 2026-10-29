import { DashboardReports } from '../reports/dashboard-reports'
import type { DashboardState } from './dashboard-state'

export function DashboardContent({
  state,
  onRetry,
}: {
  state: DashboardState
  onRetry: () => void
}) {
  switch (state.status) {
    case 'loading':
      return (
        <div className="dashboard-state" role="status">
          Загружаем статистику…
        </div>
      )
    case 'empty':
      return (
        <div className="dashboard-state">
          <h2>Пока нет данных</h2>
          <p>За выбранный период нет статистики для отображения.</p>
        </div>
      )
    case 'error':
      return (
        <div className="dashboard-state" role="alert">
          <h2>Статистика недоступна</h2>
          <p>{state.message}</p>
          <button className="dashboard-refresh" onClick={onRetry} type="button">
            Повторить
          </button>
        </div>
      )
    case 'ready':
      return <DashboardReports report={state.report} />
  }
}
