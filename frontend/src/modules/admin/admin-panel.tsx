import { useState } from 'react'
import type { AuthSessionStore } from '../auth/application/auth-session-store'
import type { AdminAccount } from '../auth/domain/auth-session'
import { adminGateway } from './adapters/admin-gateway'
import type { Resource } from './domain/admin'
import { AdminResource } from './presentation/admin-resource'
import { AdminStatistics } from './presentation/admin-statistics'
import { AdminError } from './presentation/admin-error'
import './admin.css'

const tabs = {
  companies: 'Компании',
  integrations: 'Базы 1С',
  users: 'Администрация',
  statistics: 'Статистика',
} as const
export function AdminPanel({
  account,
  auth,
  error,
}: {
  account: AdminAccount
  auth: AuthSessionStore
  error?: Error
}) {
  const [tab, setTab] = useState<Resource | 'statistics'>('companies')
  return (
    <main className="admin-panel">
      <header>
        <div>
          <h1>Администрирование</h1>
          <p>
            {account.name} · {account.email}
          </p>
        </div>
        <button onClick={() => void auth.logout().catch(() => undefined)}>
          Выйти
        </button>
      </header>
      <AdminError error={error} />
      <nav aria-label="Разделы администрации">
        {Object.entries(tabs).map(([key, label]) => (
          <button
            key={key}
            aria-current={tab === key ? 'page' : undefined}
            onClick={() => setTab(key as typeof tab)}
          >
            {label}
          </button>
        ))}
      </nav>
      <h2>{tabs[tab]}</h2>
      {tab === 'statistics' ? (
        <AdminStatistics gateway={adminGateway} expire={auth.expireSession} />
      ) : (
        <AdminResource
          key={tab}
          resource={tab}
          gateway={adminGateway}
          expire={auth.expireSession}
          currentUserId={account.id}
        />
      )}
    </main>
  )
}
