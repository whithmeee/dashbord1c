import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useInterfaceMotion } from '../../shared/motion/use-interface-motion'
import { DashboardNavigation } from './presentation/catalog/dashboard-navigation'
import { ReportCatalog } from './presentation/catalog/report-catalog'
import { DashboardPage } from './presentation/page/dashboard-page'
import { createDemoDashboardSource } from './adapters/demo/demo-dashboard-source'
import { DemoNotice } from './adapters/demo/demo-controls'
import { dashboardSectionMotion, getDashboardSectionTransition } from './dashboard-section-motion'
import './dashboard-section-motion.css'

const demoDashboardSource = createDemoDashboardSource('ready')

export function Dashboard({
  onBack,
  expanded,
  onToggleExpanded,
}: {
  onBack: () => void
  expanded: boolean
  onToggleExpanded: () => void
}) {
  const [view, setView] = useState<'overview' | 'catalog'>('overview')
  const workspaceRef = useRef<HTMLDivElement>(null)
  const selectView = (next: 'overview' | 'catalog') => {
    setView(next)
    workspaceRef.current?.scrollIntoView({ block: 'start' })
  }
  const { reducedMotion } = useInterfaceMotion()
  const sectionTransition = getDashboardSectionTransition(Boolean(reducedMotion))
  const sectionProps = (active: boolean) => ({
    initial: active && !reducedMotion ? dashboardSectionMotion.initial : false,
    animate: active ? dashboardSectionMotion.enter : dashboardSectionMotion.exit,
    transition: sectionTransition,
    'aria-hidden': !active,
    inert: !active,
  })
  return (
    <div
      className="dashboard-workspace"
      data-expanded={expanded}
      ref={workspaceRef}
    >
      <DashboardNavigation
        expanded={expanded}
        onToggleExpanded={onToggleExpanded}
        active={view}
        onSelect={selectView}
        onBack={onBack}
      />
      <div className="dashboard-section-transition">
      <motion.div className="dashboard-section" data-dashboard-section="overview" {...sectionProps(view === 'overview')}>
        <DashboardPage
          loadDashboard={demoDashboardSource}
          onBack={onBack}
          notice={<DemoNotice />}
          footer={null}
        />
      </motion.div>
      <motion.div className="dashboard-section" data-dashboard-section="catalog" {...sectionProps(view === 'catalog')}>
        <ReportCatalog onOpenOverview={() => selectView('overview')} />
      </motion.div>
      </div>
    </div>
  )
}
