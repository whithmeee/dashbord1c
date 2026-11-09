import { motion, useReducedMotion } from 'motion/react'
import { AlertCircle, CheckCircle2, Database, MessageSquare, RotateCcw, Sparkles, Users } from 'lucide-react'
import type { CabinetDashboard, CabinetTab } from '../../domain/cabinet'
import type { CabinetDetailsState } from '../../application/cabinet-details-store'
import { OverviewSubscription } from './overview-subscription'
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
  const entrance = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reducedMotion ? 0 : 0.3 },
    },
  }

  const details = detailsState.status === 'success' ? detailsState : undefined
  const system = details?.systemStatus
  const subscription = details?.subscription
  const requests = details?.statistics.total
  const systemBadge = system?.status === 'operational' ? 'В норме' : system?.status === 'degraded' ? 'Частично' : system?.status === 'inactive' ? 'Не активно' : 'Проверяем'

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
            {subscription ? (subscription.status === 'active' ? 'Активна' : 'Неактивна') : dashboard.company.subscriptionStatus === 'active' ? 'Активна' : 'Неактивна'}
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
          <span className="cabinet-kpi-value">{requests ?? '—'}</span>
          <span className="cabinet-kpi-label">Запросы к ИИ за месяц</span>
          <span className="cabinet-kpi-badge cabinet-kpi-badge-muted">{details ? `${details.statistics.summary.activeDays} активных дней` : 'Загрузка'}</span>
        </div>
      </motion.div>
      <motion.section className="cabinet-system-status cabinet-panel" variants={entrance}>
        <div className="cabinet-system-status-icon" data-status={system?.status ?? 'loading'}>{system?.status === 'inactive' ? <AlertCircle size={20} aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}</div>
        <div>
          <h2>Состояние системы</h2>
          <p>{system?.message ?? (detailsState.status === 'error' ? 'Не удалось получить состояние подключений.' : 'Проверяем доступность интеграций и сервисов.')}</p>
          <strong>{system ? `${system.activeCount} из ${system.total} интеграций активны` : 'Обновляем данные'}</strong>
        </div>
        <span className="cabinet-kpi-badge">{systemBadge}</span>
      </motion.section>
      {detailsState.status === 'error' && (
        <div className="cabinet-details-error" role="alert">
          <AlertCircle size={17} aria-hidden="true" />
          <span>Дополнительные данные кабинета недоступны.</span>
          <button type="button" className="cabinet-button cabinet-button-secondary" onClick={onRetryDetails}><RotateCcw size={15} /> Повторить</button>
        </div>
      )}
      <div className="cabinet-overview-grid">
        <div><OverviewSubscription subscription={subscription} fallbackStatus={dashboard.company.subscriptionStatus} /></div>
        <div className="cabinet-panel cabinet-statistics-summary">
          <div className="cabinet-panel-heading"><h2>Активность запросов</h2><MessageSquare size={20} aria-hidden="true" /></div>
          <p>За выбранный период: {requests ?? '—'} запросов</p>
          <strong>{details ? `Пиковый день: ${details.statistics.summary.peakDay?.date ?? 'нет данных'}` : 'Статистика загружается'}</strong>
        </div>
      </div>
    </motion.div>
  )
}
