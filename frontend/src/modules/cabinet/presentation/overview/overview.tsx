import { motion, useReducedMotion } from 'motion/react'
import { MessageSquare, Database } from 'lucide-react'
import type { CabinetDashboard, CabinetTab } from '../../domain/cabinet'
import { OverviewIntegrations } from './overview-integrations'
import { OverviewSubscription } from './overview-subscription'
import './overview.css'

type OverviewProps = {
  animateEntrance: boolean
  dashboard: CabinetDashboard
  onOpenChat: () => void
  onSelectTab: (tab: CabinetTab) => void
}

export function Overview({
  dashboard,
  onOpenChat,
  onSelectTab,
  animateEntrance,
}: OverviewProps) {
  const reducedMotion = useReducedMotion()
  const entrance = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reducedMotion ? 0 : 0.3 },
    },
  }

  return (
    <motion.div
      initial={animateEntrance && !reducedMotion ? 'hidden' : false}
      animate="visible"
      transition={{ staggerChildren: reducedMotion ? 0 : 0.07 }}
      data-testid="cabinet-overview"
    >
      <motion.div className="cabinet-summary" variants={entrance}>
        <button
          className="cabinet-summary-card cabinet-chat-link"
          type="button"
          onClick={onOpenChat}
          data-testid="cabinet-open-chat"
        >
          <MessageSquare size={22} />
          <span>
            <strong>Чат</strong>
            <small>Открыть помощника</small>
          </span>
        </button>
        <button
          className="cabinet-summary-card"
          type="button"
          onClick={() => onSelectTab('integrations')}
        >
          <Database size={22} />
          <span>
            <strong>{dashboard.integrations.count}</strong>
            <small>Интеграций</small>
          </span>
        </button>
      </motion.div>
      <div className="cabinet-overview-grid">
        <motion.div variants={entrance}>
          <OverviewIntegrations
            integrations={dashboard.integrations.items}
            onOpenChat={onOpenChat}
          />
        </motion.div>
        <motion.div variants={entrance}>
          <OverviewSubscription status={dashboard.company.subscriptionStatus} />
        </motion.div>
      </div>
    </motion.div>
  )
}
