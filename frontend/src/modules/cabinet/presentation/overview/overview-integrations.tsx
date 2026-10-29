import { Database, ArrowUpRight, MessageSquare } from 'lucide-react'
import type { CabinetOverview } from '../../domain/cabinet'

export function OverviewIntegrations({
  integrations,
  onOpenChat,
}: {
  integrations: CabinetOverview['integrations']
  onOpenChat: () => void
}) {
  return (
    <section className="cabinet-panel cabinet-integrations">
      <div className="cabinet-panel-heading">
        <h2>Интеграции</h2>
        <Database size={18} />
      </div>
      <p>
        Системы, с которыми работает ваш чат. Подключает администратор Osminog.
      </p>
      {integrations.map((integration) => (
        <div className="cabinet-integration" key={integration.id}>
          <span className="cabinet-integration-icon">
            <Database size={20} />
          </span>
          <div>
            <strong>{integration.name}</strong>
            <p>{integration.configuration}</p>
          </div>
          <span
            className={
              integration.connected
                ? 'cabinet-badge'
                : 'cabinet-badge cabinet-badge-offline'
            }
          >
            {integration.connected ? 'На связи' : 'Нет связи'}
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
