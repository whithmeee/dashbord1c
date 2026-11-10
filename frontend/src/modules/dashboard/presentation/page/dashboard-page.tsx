import type { ReactNode } from 'react'
import type { LoadDashboard } from '../../application/load-dashboard'
import { useDashboard } from './use-dashboard'
import { RefreshCw } from 'lucide-react'
import { DashboardPeriods } from './dashboard-periods'
import { DashboardContent } from './dashboard-content'
import { isDashboardLoading } from './dashboard-state'
import { DashboardUpdateStatus } from './dashboard-loading'
import './dashboard.css'
import './dashboard-responsive.css'
import './dashboard-mobile.css'
import './dashboard-overview.css'

type DashboardPageProps = {
  loadDashboard: LoadDashboard
  onBack: () => void
  notice: ReactNode
  footer: ReactNode
  navigation?: ReactNode
}

export function DashboardPage({
  loadDashboard,
  notice,
  footer,
  navigation,
}: DashboardPageProps) {
  const dashboard = useDashboard(loadDashboard)
  const isLoading = isDashboardLoading(dashboard.state)

  return (
    <section className="dashboard" data-testid="dashboard">
      <div className="dashboard-overview-topbar">
        {navigation}
        <div className="dashboard-overview-actions">
          {notice}
          <button className="dashboard-refresh" onClick={dashboard.refresh} type="button" disabled={isLoading} data-testid="dashboard-refresh">
            <RefreshCw size={16} /> Обновить
          </button>
        </div>
      </div>
      <div className="dashboard-overview-heading">
        <header className="dashboard-header">
          <div>
            <h1>Аналитика</h1>
            <DashboardUpdateStatus state={dashboard.state} />
          </div>
        </header>
        <DashboardPeriods period={dashboard.period} onSelectPeriod={dashboard.selectPeriod} />
      </div>
      <div aria-busy={isLoading}>
        <DashboardContent state={dashboard.state} onRetry={dashboard.refresh} />
      </div>
      {footer}
    </section>
  )
}
