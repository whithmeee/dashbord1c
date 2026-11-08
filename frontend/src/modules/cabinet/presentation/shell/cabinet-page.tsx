import { useState } from 'react'
import { motion } from 'motion/react'
import { useInterfaceMotion } from '../../../../shared/motion/use-interface-motion'
import {
  describeCabinetDashboard,
  getCabinetInitials,
  type CabinetDashboard,
  type CabinetTab,
} from '../../domain/cabinet'
import { CabinetTabs } from './cabinet-tabs'
import { Overview } from '../overview/overview'
import { IntegrationsPage } from '../../../integrations/presentation/integrations-page'
import { UsersPage } from '../../../employees/presentation/users-page'
import './cabinet.css'
import './cabinet-responsive.css'
import './cabinet-tab-picker.css'

export function CabinetPage({
  dashboard,
  canManageEmployees,
}: {
  dashboard: CabinetDashboard
  canManageEmployees: boolean
}) {
  const [activeTab, setActiveTab] = useState<CabinetTab>('overview')
  const { appearance } = useInterfaceMotion()
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={appearance}
      >
        {activeTab === 'overview' ? (
          <Overview
            dashboard={dashboard}
            onSelectTab={selectTab}
            animateEntrance={animateOverview}
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
