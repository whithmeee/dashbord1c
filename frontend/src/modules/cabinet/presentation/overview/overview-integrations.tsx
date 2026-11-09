import { Database, ArrowUpRight, MessageSquare } from 'lucide-react'
import type { CabinetIntegration } from '../../domain/cabinet'

export function OverviewIntegrations({
  integrations,
  onOpenChat,
}: {
  integrations: readonly CabinetIntegration[]
  onOpenChat: () => void
}) {
  return (
    <section className="cabinet-panel cabinet-integrations">
      <div className="cabinet-panel-heading">
        <h2>Синхронизация с 1С</h2>
        <Database size={18} />
      </div>
      <p>
        Системы, с которыми работает ваш чат. Подключает администратор Osminog.
      </p>
      {integrations.length === 0 ? (
        <p className="cabinet-empty-state" data-testid="cabinet-integrations-empty">
          Интеграции пока не подключены.
        </p>
      ) : integrations.map((integration) => (
        <div className="cabinet-integration" key={integration.id}>
          <span className="cabinet-integration-icon">
            <Database size={20} />
          </span>
          <div>
            <strong>{integration.name}</strong>
            <p>{integration.configName ?? 'Конфигурация не указана'}</p>
          </div>
          <span
            className={
              integration.status === 'active'
                ? 'cabinet-badge'
                : 'cabinet-badge cabinet-badge-offline'
            }
          >
            {integration.status === 'active' ? 'Активна' : 'Отключена'}
          </span>
        </div>
      ))}
      <button
        className="cabinet-button cabinet-button-primary"
        type="button"
        onClick={onOpenChat}
      >
        <MessageSquare size={16} />
        Открыть чат
        <ArrowUpRight size={16} />
      </button>
    </section>
  )
}
