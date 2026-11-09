import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { CabinetDetailsState } from '../../application/cabinet-details-store'
import type { CabinetIntegrationReason, CabinetSystemState } from '../../domain/cabinet-details'

const systemBadges: Record<CabinetSystemState, string> = {
  operational: 'В норме',
  degraded: 'Частично',
  inactive: 'Не активно',
}

const reasonLabels: Record<Exclude<CabinetIntegrationReason, null>, string> = {
  disabled: 'отключена администратором',
  unreachable: 'не отвечает',
}

function describeSystem(detailsState: CabinetDetailsState): string {
  if (detailsState.status === 'success') {
    return detailsState.systemStatus.message
  }

  return detailsState.status === 'error'
    ? 'Не удалось получить состояние подключений.'
    : 'Проверяем доступность интеграций и сервисов.'
}

export function OverviewSystemStatus({ detailsState }: { detailsState: CabinetDetailsState }) {
  const system = detailsState.status === 'success' ? detailsState.systemStatus : undefined

  return (
    <>
      <div className="cabinet-system-status-icon" data-status={system?.status ?? 'loading'}>
        {system?.status === 'inactive' ? (
          <AlertCircle size={20} aria-hidden="true" />
        ) : (
          <CheckCircle2 size={20} aria-hidden="true" />
        )}
      </div>
      <div>
        <h2>Состояние системы</h2>
        <p data-testid="system-status-message">{describeSystem(detailsState)}</p>
        <strong>
          {system ? `${system.activeCount} из ${system.total} интеграций активны` : 'Обновляем данные'}
        </strong>
        {system && system.integrations.length > 0 && (
          <ul className="cabinet-system-bases" data-testid="system-status-bases">
            {system.integrations.map((integration) => (
              <li key={integration.id} data-status={integration.status}>
                <span className="cabinet-system-base-dot" aria-hidden="true" />
                <span>{integration.name}</span>
                <small>
                  {integration.status === 'active'
                    ? 'активна'
                    : `не активна${integration.reason ? ` · ${reasonLabels[integration.reason]}` : ''}`}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
      <span className="cabinet-kpi-badge">{system ? systemBadges[system.status] : 'Проверяем'}</span>
    </>
  )
}
