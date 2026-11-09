import { useState } from 'react'
import { motion } from 'motion/react'
import { useInterfaceMotion } from '../../../../shared/motion/use-interface-motion'
import {
  describeCabinetDashboard,
  getCabinetInitials,
  type CabinetDashboard,
  type CabinetTab,
} from '../../domain/cabinet'
import type { CabinetDetailsState } from '../../application/cabinet-details-store'
import { CabinetTabs } from './cabinet-tabs'
import { Overview } from '../overview/overview'
import { IntegrationsPage } from '../../../integrations/presentation/integrations-page'
import { UsersPage } from '../../../employees/presentation/users-page'
import './cabinet.css'
import './cabinet-responsive.css'
import './cabinet-tab-picker.css'

export function CabinetPage({
  dashboard,
  detailsState,
  canManageEmployees,
  onRetryDetails,
}: {
  dashboard: CabinetDashboard
  detailsState: CabinetDetailsState
  canManageEmployees: boolean
  onRetryDetails: () => void
}) {
  const [activeTab, setActiveTab] = useState<CabinetTab>('overview')
  const { appearance, reducedMotion } = useInterfaceMotion()
  const [animateOverview, setAnimateOverview] = useState(true)
  const selectTab = (tab: CabinetTab) => {
    setAnimateOverview(false)
    setActiveTab(tab)
  }
  return (
    <section className="cabinet" data-testid="cabinet">
      <p className="cabinet-breadcrumb">
        Рабочее пространство <span>/</span> Мой кабинет
      </p>
      <header className="cabinet-header">
        <div className="cabinet-identity">
          <span className="cabinet-avatar">{getCabinetInitials(dashboard.company.name)}</span>
          <div>
            <h1>{dashboard.company.name}</h1>
            <p>{describeCabinetDashboard(dashboard)}</p>
          </div>
        </div>
      </header>
      <CabinetTabs active={activeTab} onSelect={selectTab} canManageEmployees={canManageEmployees} />

      <motion.div
        key={activeTab}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, transform: 'translateY(4px)' }}
        animate={{ opacity: 1, transform: 'translateY(0)' }}
        transition={{ ...appearance, duration: reducedMotion ? 0 : 0.12, ease: [0.23, 1, 0.32, 1] }}
      >
        {activeTab === 'overview' ? (
          <Overview
            dashboard={dashboard}
            detailsState={detailsState}
            onSelectTab={selectTab}
            animateEntrance={animateOverview}
            onRetryDetails={onRetryDetails}
          />
        ) : activeTab === 'integrations' ? (
          <IntegrationsPage />
        ) : (
          <UsersPage canManage={canManageEmployees} />
        )}
      </motion.div>
    </section>
  )
}
