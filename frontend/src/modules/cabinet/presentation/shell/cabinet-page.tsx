import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
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

export function CabinetPage({
  overview,
  onOpenChat,
}: {
  overview: CabinetOverview
  onOpenChat: () => void
}) {
  const [activeTab, setActiveTab] = useState<CabinetTab>('overview')
  const reducedMotion = useReducedMotion()
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
      <CabinetTabs active={activeTab} onSelect={setActiveTab} />
      <div className="cabinet-demo">
        <FlaskConical size={16} />
        <span>
          Демонстрационный кабинет · данные и статусы подключения вымышлены.
        </span>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reducedMotion ? 0 : -6 }}
          transition={{ duration: reducedMotion ? 0 : 0.18 }}
        >
          {activeTab === 'overview' ? (
            <Overview
              overview={overview}
              onOpenChat={onOpenChat}
              onSelectTab={setActiveTab}
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
                onClick={() => setActiveTab('overview')}
              >
                Вернуться к обзору
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
