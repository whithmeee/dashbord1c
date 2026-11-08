import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useInterfaceMotion } from '../../shared/motion/use-interface-motion'
import { DashboardNavigation } from './presentation/catalog/dashboard-navigation'
import { ReportCatalog } from './presentation/catalog/report-catalog'
import { FinancialSalesPage } from './presentation/financial-sales-page'

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
  const { appearance } = useInterfaceMotion()
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
      <motion.div
        hidden={view !== 'overview'}
        initial={false}
        animate={{ opacity: view === 'overview' ? 1 : 0 }}
        transition={appearance}
      >
        <FinancialSalesPage onBack={onBack} />
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
