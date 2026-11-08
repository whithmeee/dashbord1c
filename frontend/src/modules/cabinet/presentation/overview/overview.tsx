import { motion, useReducedMotion } from 'motion/react'
import { CheckCircle2, Database, MessageSquare, Sparkles, Users } from 'lucide-react'
import type { CabinetDashboard, CabinetTab } from '../../domain/cabinet'
import './overview.css'

type OverviewProps = {
  animateEntrance: boolean
  dashboard: CabinetDashboard
  onSelectTab: (tab: CabinetTab) => void
}

export function Overview({
  dashboard,
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
      <motion.div className="cabinet-kpi-grid" variants={entrance}>
        <button className="cabinet-kpi-card" type="button" onClick={() => onSelectTab('integrations')}>
          <Database size={20} aria-hidden="true" />
          <span className="cabinet-kpi-value">{dashboard.integrations.count}</span>
          <span className="cabinet-kpi-label">Подключено систем</span>
          <span className="cabinet-kpi-badge">{dashboard.integrations.activeCount > 0 ? 'Активна' : 'Нет активных'}</span>
        </button>
        <div className="cabinet-kpi-card">
          <Sparkles size={20} aria-hidden="true" />
          <span className="cabinet-kpi-value cabinet-kpi-value-status">
            {dashboard.company.subscriptionStatus === 'active' ? 'Активна' : 'Неактивна'}
          </span>
          <span className="cabinet-kpi-label">Статус подписки</span>
          <span className="cabinet-kpi-badge">Доступен кабинет</span>
        </div>
        <div className="cabinet-kpi-card">
          <Users size={20} aria-hidden="true" />
          <span className="cabinet-kpi-value">{dashboard.employees?.count ?? '—'}</span>
          <span className="cabinet-kpi-label">Активные пользователи</span>
          <span className="cabinet-kpi-badge cabinet-kpi-badge-muted">{dashboard.employees ? `${dashboard.employees.onlineCount} онлайн` : 'Для владельца'}</span>
        </div>
        <div className="cabinet-kpi-card">
          <MessageSquare size={20} aria-hidden="true" />
          <span className="cabinet-kpi-value">—</span>
          <span className="cabinet-kpi-label">Запросы к ИИ за месяц</span>
          <span className="cabinet-kpi-badge cabinet-kpi-badge-muted">Скоро появится</span>
        </div>
      </motion.div>
      <motion.section className="cabinet-system-status cabinet-panel" variants={entrance}>
        <div className="cabinet-system-status-icon"><CheckCircle2 size={20} aria-hidden="true" /></div>
        <div>
          <h2>Состояние системы</h2>
          <p>Интеграции и кабинет доступны. Проверка подключения к 1С выполняется в разделе синхронизации.</p>
          <strong>Все доступные компоненты работают</strong>
        </div>
        <span className="cabinet-kpi-badge">В норме</span>
      </motion.section>
    </motion.div>
  )
}
