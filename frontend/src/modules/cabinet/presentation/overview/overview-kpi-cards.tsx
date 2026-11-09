import { Database, MessageSquare, Sparkles, Users } from 'lucide-react'
import type { SectionAccess } from '../../../auth/domain/section-access'
import type { CabinetDashboard, CabinetTab } from '../../domain/cabinet'
import type { CabinetDetailsState } from '../../application/cabinet-details-store'

export type OverviewDialog = 'subscription' | 'employees' | 'statistics'

type OverviewKpiCardsProps = {
  dashboard: CabinetDashboard
  detailsState: CabinetDetailsState
  access: SectionAccess
  onSelectTab: (tab: CabinetTab) => void
  onOpenDialog: (dialog: OverviewDialog) => void
}

export function OverviewKpiCards({
  dashboard,
  detailsState,
  access,
  onSelectTab,
  onOpenDialog,
}: OverviewKpiCardsProps) {
  const details = detailsState.status === 'success' ? detailsState : undefined
  const subscription = details?.subscription
  const statistics = details?.statistics
  const subscriptionStatus = subscription?.status ?? dashboard.company.subscriptionStatus
  const employees = dashboard.employees
  const integrations = dashboard.integrations

  return (
    <>
      {access('integrations') && integrations && (
        <button
          className="cabinet-kpi-card"
          type="button"
          data-testid="kpi-integrations"
          onClick={() => onSelectTab('integrations')}
        >
          <Database size={20} aria-hidden="true" />
          <span className="cabinet-kpi-value">{integrations.count}</span>
          <span className="cabinet-kpi-label">Подключено систем</span>
          <span className="cabinet-kpi-badge">
            {integrations.activeCount > 0 ? 'Активна' : 'Нет активных'}
          </span>
        </button>
      )}
      {access('subscription') && (
        <button
          className="cabinet-kpi-card"
          type="button"
          data-testid="kpi-subscription"
          onClick={() => onOpenDialog('subscription')}
        >
          <Sparkles size={20} aria-hidden="true" />
          <span className="cabinet-kpi-value cabinet-kpi-value-status">
            {subscriptionStatus === 'active' ? 'Активна' : 'Неактивна'}
          </span>
          <span className="cabinet-kpi-label">Статус подписки</span>
          <span className="cabinet-kpi-badge">
            {subscription ? `Осталось дней: ${subscription.daysLeft}` : 'Подробнее'}
          </span>
        </button>
      )}
      {employees ? (
        <button
          className="cabinet-kpi-card"
          type="button"
          data-testid="kpi-employees"
          onClick={() => onOpenDialog('employees')}
        >
          <Users size={20} aria-hidden="true" />
          <span className="cabinet-kpi-value">{employees.count}</span>
          <span className="cabinet-kpi-label">Активные пользователи</span>
          <span className="cabinet-kpi-badge cabinet-kpi-badge-muted">{employees.onlineCount} онлайн</span>
        </button>
      ) : (
        <div className="cabinet-kpi-card cabinet-kpi-card-static" data-testid="kpi-employees">
          <Users size={20} aria-hidden="true" />
          <span className="cabinet-kpi-value">—</span>
          <span className="cabinet-kpi-label">Активные пользователи</span>
          <span className="cabinet-kpi-badge cabinet-kpi-badge-muted">Для владельца</span>
        </div>
      )}
      {access('analytics') && (
        <button
          className="cabinet-kpi-card"
          type="button"
          data-testid="kpi-statistics"
          onClick={() => onOpenDialog('statistics')}
        >
          <MessageSquare size={20} aria-hidden="true" />
          <span className="cabinet-kpi-value">{statistics?.total ?? '—'}</span>
          <span className="cabinet-kpi-label">Запросы к ИИ за месяц</span>
          <span className="cabinet-kpi-badge cabinet-kpi-badge-muted">
            {statistics ? `${statistics.summary.activeDays} активных дней` : 'Загрузка'}
          </span>
        </button>
      )}
    </>
  )
}
