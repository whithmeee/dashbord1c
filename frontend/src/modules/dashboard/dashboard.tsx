import { useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useInterfaceMotion } from '../../shared/motion/use-interface-motion'
import { DashboardNavigation } from './presentation/catalog/dashboard-navigation'
import { ReportCatalog } from './presentation/catalog/report-catalog'
import { createLoadDashboard } from './application/load-dashboard'
import {
  createDemoDashboardSource,
  type DemoScenario,
} from './adapters/demo/demo-dashboard-source'
import { DemoControls, DemoNotice } from './adapters/demo/demo-controls'
import { DashboardPage } from './presentation/page/dashboard-page'

export function Dashboard({ onBack }: { onBack: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [view, setView] = useState<'overview' | 'catalog'>('overview')
  const workspaceRef = useRef<HTMLDivElement>(null)
  const selectView = (next: 'overview' | 'catalog') => {
    setView(next)
    workspaceRef.current?.scrollIntoView({ block: 'start' })
  }
  const { appearance } = useInterfaceMotion()
  const [scenario, setScenario] = useState<DemoScenario>('ready')
  const loadDashboard = useMemo(
    () => createLoadDashboard(createDemoDashboardSource(scenario)),
    [scenario],
  )

  return (
    <div
      className="dashboard-workspace"
      data-expanded={expanded}
      ref={workspaceRef}
    >
      <DashboardNavigation
        expanded={expanded}
        onToggleExpanded={() => setExpanded((current) => !current)}
        active={view}
        onSelect={selectView}
        onBack={onBack}
      />
      <motion.div
        hidden={view !== 'overview'}
        initial={false}
        animate={{ opacity: view === 'overview' ? 1 : 0 }}
        transition={appearance}
      >
        <DashboardPage
          loadDashboard={loadDashboard}
          onBack={onBack}
          notice={<DemoNotice />}
          footer={
            <DemoControls scenario={scenario} onSelectScenario={setScenario} />
          }
        />
      </motion.div>
      <motion.div
        hidden={view !== 'catalog'}
        initial={false}
        animate={{ opacity: view === 'catalog' ? 1 : 0 }}
        transition={appearance}
      >
        <ReportCatalog onOpenOverview={() => selectView('overview')} />
      </motion.div>
    </div>
  )
}
