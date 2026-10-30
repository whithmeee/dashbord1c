import { motion, useReducedMotion } from 'motion/react'
import { MessageSquare, Database, CalendarDays } from 'lucide-react'
import type { CabinetOverview, CabinetTab } from '../../domain/cabinet'
import { OverviewIntegrations } from './overview-integrations'
import { OverviewAccess } from './overview-access'
import './overview.css'

type OverviewProps = {
  animateEntrance: boolean
  overview: CabinetOverview
  onOpenChat: () => void
  onSelectTab: (tab: CabinetTab) => void
}

export function Overview({
  overview,
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
            <strong>{overview.integrations.length}</strong>
            <small>Интеграций</small>
          </span>
        </button>
        <button
          className="cabinet-summary-card"
          type="button"
          onClick={() => onSelectTab('subscription')}
        >
          <CalendarDays size={22} />
          <span>
            <strong>{overview.subscription.daysRemaining}</strong>
            <small>Дней доступа</small>
          </span>
        </button>
      </motion.div>
      <div className="cabinet-overview-grid">
        <motion.div variants={entrance}>
          <OverviewIntegrations
            integrations={overview.integrations}
            onOpenChat={onOpenChat}
          />
        </motion.div>
        <motion.div className="cabinet-access" variants={entrance}>
          <OverviewAccess
            subscription={overview.subscription}
            plan={overview.plan}
            onSelectTab={onSelectTab}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
