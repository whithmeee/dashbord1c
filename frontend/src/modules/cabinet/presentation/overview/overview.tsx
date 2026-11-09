import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import type { CabinetDashboard, CabinetTab } from '../../domain/cabinet'
import type { CabinetDetailsState } from '../../application/cabinet-details-store'
import { EmployeesDialog } from '../details/employees-dialog'
import { StatisticsDialog } from '../details/statistics-dialog'
import { SubscriptionDialog } from '../details/subscription-dialog'
import { OverviewKpiCards, type OverviewDialog } from './overview-kpi-cards'
import { OverviewSystemStatus } from './overview-system-status'
import './overview.css'

type OverviewProps = {
  animateEntrance: boolean
  dashboard: CabinetDashboard
  onSelectTab: (tab: CabinetTab) => void
  detailsState: CabinetDetailsState
  onRetryDetails: () => void
}

export function Overview({
  dashboard,
  onSelectTab,
  animateEntrance,
  detailsState,
  onRetryDetails,
}: OverviewProps) {
  const reducedMotion = useReducedMotion()
  const [dialog, setDialog] = useState<OverviewDialog | null>(null)
  const entrance = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reducedMotion ? 0 : 0.3 },
    },
  }

  const details = detailsState.status === 'success' ? detailsState : undefined
  const closeDialog = () => setDialog(null)

  return (
    <motion.div
      initial={animateEntrance && !reducedMotion ? 'hidden' : false}
      animate="visible"
      transition={{ staggerChildren: reducedMotion ? 0 : 0.07 }}
      data-testid="cabinet-overview"
    >
      <motion.div className="cabinet-kpi-grid" variants={entrance}>
        <OverviewKpiCards
          dashboard={dashboard}
          detailsState={detailsState}
          onSelectTab={onSelectTab}
          onOpenDialog={setDialog}
        />
      </motion.div>
      <motion.section className="cabinet-system-status cabinet-panel" variants={entrance}>
        <OverviewSystemStatus detailsState={detailsState} />
      </motion.section>
      {detailsState.status === 'error' && (
        <div className="cabinet-details-error" role="alert">
          <AlertCircle size={17} aria-hidden="true" />
          <span>Дополнительные данные кабинета недоступны.</span>
          <button type="button" className="cabinet-button cabinet-button-secondary" onClick={onRetryDetails}>
            <RotateCcw size={15} /> Повторить
          </button>
        </div>
      )}
      {dialog === 'subscription' && (
        <SubscriptionDialog subscription={details?.subscription} onClose={closeDialog} />
      )}
      {dialog === 'employees' && <EmployeesDialog onClose={closeDialog} />}
      {dialog === 'statistics' && <StatisticsDialog onClose={closeDialog} />}
    </motion.div>
  )
}
