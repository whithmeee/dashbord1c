import { useState } from 'react'
import { motion } from 'motion/react'
import { useInterfaceMotion } from '../../../../shared/motion/use-interface-motion'
import { Construction, FlaskConical } from 'lucide-react'
import {
  describeCabinet,
  type CabinetOverview,
  type CabinetTab,
} from '../../domain/cabinet'
import { CabinetTabs } from './cabinet-tabs'
import { cabinetTabs } from './cabinet-tabs.config'
import { Overview } from '../overview/overview'
import './cabinet.css'
import './cabinet-responsive.css'
import './cabinet-tab-picker.css'

export function CabinetPage({
  overview,
  onOpenChat,
}: {
  overview: CabinetOverview
  onOpenChat: () => void
}) {
  const [activeTab, setActiveTab] = useState<CabinetTab>('overview')
  const { appearance } = useInterfaceMotion()
  const [animateOverview, setAnimateOverview] = useState(true)
  const selectTab = (tab: CabinetTab) => {
    setAnimateOverview(false)
    setActiveTab(tab)
  }
  const tab = cabinetTabs.find((item) => item.id === activeTab)

  return (
    <section className="cabinet" data-testid="cabinet">
      <p className="cabinet-breadcrumb">
        Рабочее пространство <span>/</span> Мой кабинет
      </p>
      <header className="cabinet-header">
        <div className="cabinet-identity">
          <span className="cabinet-avatar">{overview.initials}</span>
          <div>
            <h1>{overview.name}</h1>
            <p>{describeCabinet(overview)}</p>
          </div>
        </div>
        <span className="cabinet-badge">{overview.subscription.label}</span>
      </header>
      <CabinetTabs active={activeTab} onSelect={selectTab} />
      <div className="cabinet-demo">
        <FlaskConical size={16} />
        <span>
          Демонстрационный кабинет · данные и статусы подключения вымышлены.
        </span>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={appearance}
      >
        {activeTab === 'overview' ? (
          <Overview
            overview={overview}
            onOpenChat={onOpenChat}
            onSelectTab={selectTab}
            animateEntrance={animateOverview}
          />
        ) : (
          <div
            className="cabinet-placeholder"
            data-testid="cabinet-placeholder"
          >
            <Construction size={30} />
            <h2>{tab?.label}</h2>
            <p>Эту вкладку добавим на следующем этапе.</p>
            <button
              className="cabinet-button"
              type="button"
              onClick={() => selectTab('overview')}
            >
              Вернуться к обзору
            </button>
          </div>
        )}
      </motion.div>
    </section>
  )
}
