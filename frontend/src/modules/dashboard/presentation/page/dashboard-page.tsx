import type { ReactNode } from 'react'
import type { LoadDashboard } from '../../application/load-dashboard'
import { useDashboard } from './use-dashboard'
import { DashboardHeader } from './dashboard-header'
import { DashboardPeriods } from './dashboard-periods'
import { DashboardContent } from './dashboard-content'
import { isDashboardLoading } from './dashboard-state'
import { DashboardUpdateStatus } from './dashboard-loading'
import './dashboard.css'
import './dashboard-responsive.css'
import './dashboard-mobile.css'

type DashboardPageProps = {
  loadDashboard: LoadDashboard
  onBack: () => void
  notice: ReactNode
  footer: ReactNode
}

export function DashboardPage({
  loadDashboard,
  onBack,
  notice,
  footer,
}: DashboardPageProps) {
  const dashboard = useDashboard(loadDashboard)
  const isLoading = isDashboardLoading(dashboard.state)

  return (
    <section className="dashboard" data-testid="dashboard">
      <DashboardHeader
        onBack={onBack}
        onRefresh={dashboard.refresh}
        isLoading={isLoading}
      />
      {notice}
      <DashboardPeriods
        period={dashboard.period}
        onSelectPeriod={dashboard.selectPeriod}
      />
      <DashboardUpdateStatus state={dashboard.state} />
      <div aria-busy={isLoading}>
        <DashboardContent state={dashboard.state} onRetry={dashboard.refresh} />
      </div>
      {footer}
    </section>
  )
}
