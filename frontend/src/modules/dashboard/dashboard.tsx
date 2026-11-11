import { useRef, useState } from 'react'
import { DashboardNavigation } from './presentation/catalog/dashboard-navigation'
import { FinancialSalesPage, type AnalyticsView } from './presentation/financial-sales-page'
import { DashboardGlassBackground } from './dashboard-glass-background'
import './dashboard-section-motion.css'
import './dashboard-glass.css'

export function Dashboard({
  onBack,
  expanded,
  onToggleExpanded,
}: {
  onBack: () => void
  expanded: boolean
  onToggleExpanded: () => void
}) {
  const [view, setView] = useState<AnalyticsView>('overview')
  const workspaceRef = useRef<HTMLDivElement>(null)
  const selectView = (next: AnalyticsView) => {
    setView(next)
    workspaceRef.current?.scrollIntoView({ block: 'start' })
  }

  return (
    <div className="dashboard-workspace dashboard-workspace-glass" data-expanded={expanded} ref={workspaceRef}>
      <DashboardGlassBackground />
      <FinancialSalesPage
        view={view}
        navigation={(
          <DashboardNavigation
            expanded={expanded}
            onToggleExpanded={onToggleExpanded}
            active={view}
            onSelect={selectView}
            onBack={onBack}
          />
        )}
      />
    </div>
  )
}
