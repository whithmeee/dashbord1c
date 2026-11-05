import { useEffect, useSyncExternalStore } from 'react'
import { AlertCircle, CheckCircle2, Database, LoaderCircle, RotateCcw } from 'lucide-react'
import { motion } from 'motion/react'
import { ApiError } from '../../../shared/api'
import { useInterfaceMotion } from '../../../shared/motion/use-interface-motion'
import { integrationsStore } from '../integrations-runtime'
import type { Integration } from '../domain/integration'
import type { IntegrationCheckState, IntegrationsState } from '../application/integrations-store'
import { getIntegrationCheckLabel, getIntegrationStatusLabel } from './integration-status'
import './integrations.css'
import './integrations-responsive.css'

export function IntegrationsPage() {
  const state = useSyncExternalStore(
    integrationsStore.subscribe,
    integrationsStore.getSnapshot,
    integrationsStore.getSnapshot,
  )

  useEffect(() => {
    void integrationsStore.load()
  }, [])

  if (state.status === 'idle' || state.status === 'loading') {
    return <IntegrationsState />
  }

  if (state.status === 'error') {
    return <IntegrationsError state={state} />
  }

  if (state.items.length === 0) {
    return <IntegrationsEmpty />
  }

  return <IntegrationsList state={state} />
}

function IntegrationsList({
  state,
}: {
  state: Extract<IntegrationsState, { status: 'success' }>
}) {
  const { appearance } = useInterfaceMotion()

  return (
    <section className="integrations-page" data-testid="integrations-page">
      <header className="integrations-heading">
        <div>
          <h2>Подключённые базы 1С</h2>
          <p>Проверяйте доступность баз перед работой с данными.</p>
        </div>
        <Database size={22} aria-hidden="true" />
      </header>
      <div className="integrations-list">
        {state.items.map((integration, index) => (
          <motion.div
            className="integration-card"
            key={integration.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...appearance, delay: index * 0.05 }}
          >
            <IntegrationCard integration={integration} checkState={getCheckState(integration, state.checks)} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function IntegrationCard({
  integration,
  checkState,
}: {
  integration: Integration
  checkState: IntegrationCheckState
}) {
  const isChecking = checkState.status === 'checking'
  const isInactive = integration.status === 'inactive'
  const liveStatus = isInactive ? 'inactive' : checkState.status
  const checkedAtValue = checkState.status === 'online' || checkState.status === 'offline'
    ? checkState.checkedAt
    : undefined
  const checkedAt = checkedAtValue ? formatCheckedAt(checkedAtValue) : undefined

  return (
    <article className="integration-card-content">
      <div className="integration-card-icon" aria-hidden="true">
        <Database size={20} />
      </div>
      <div className="integration-card-main">
        <div className="integration-card-title-row">
          <div>
            <h3>{integration.name}</h3>
            <p>{integration.configName}</p>
          </div>
          <span className={`integration-status integration-status-${integration.status}`}>
            {getIntegrationStatusLabel(integration.status)}
          </span>
        </div>
        <div className="integration-card-footer">
          <span className={`integration-live integration-live-${liveStatus}`} role="status">
            {liveStatus === 'online' ? <CheckCircle2 size={15} /> : <span className="integration-live-dot" />}
            {getIntegrationCheckLabel(liveStatus)}
          </span>
          {checkedAt && <time dateTime={checkedAtValue}>{checkedAt}</time>}
          {checkState.status === 'error' && <span className="integration-check-error">{checkState.error.message}</span>}
          <button
            className="cabinet-button integration-check-button"
            type="button"
            disabled={isInactive || isChecking}
            aria-busy={isChecking}
            onClick={() => void integrationsStore.check(integration.id)}
          >
            {isChecking && <LoaderCircle className="integration-spinner" size={15} />}
            {isChecking ? 'Проверяем…' : 'Проверить подключение'}
          </button>
        </div>
      </div>
    </article>
  )
}

function IntegrationsEmpty() {
  return (
    <section className="integrations-page integrations-empty" data-testid="integrations-empty">
      <Database size={30} aria-hidden="true" />
      <h2>Базы 1С пока не подключены</h2>
      <p>Подключением баз занимается администратор Osminog.</p>
    </section>
  )
}

function IntegrationsState() {
  return (
    <section className="integrations-page integrations-state" data-testid="integrations-loading">
      <LoaderCircle className="integration-spinner" size={28} />
      <h2>Загружаем базы 1С</h2>
      <p>Получаем список подключений.</p>
    </section>
  )
}

function IntegrationsError({ state }: { state: Extract<IntegrationsState, { status: 'error' }> }) {
  return (
    <section className="integrations-page integrations-state" data-testid="integrations-error">
      <AlertCircle size={28} aria-hidden="true" />
      <h2>Не удалось загрузить базы 1С</h2>
      <p>{getErrorMessage(state.error)}</p>
      <button className="cabinet-button cabinet-button-primary" type="button" onClick={() => void integrationsStore.retry()}>
        <RotateCcw size={16} />
        Повторить
      </button>
    </section>
  )
}

function getCheckState(integration: Integration, checks: Readonly<Record<number, IntegrationCheckState>>): IntegrationCheckState {
  return checks[integration.id] ?? (integration.status === 'inactive' ? { status: 'inactive' } : { status: 'not_checked' })
}

function formatCheckedAt(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function getErrorMessage(error: Error): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'У вас нет доступа к интеграциям.'
    if (error.status === 429) return 'Проверки временно ограничены. Попробуйте позже.'
    if (error.status === 502 || error.kind === 'network') return 'Сервер 1С временно недоступен.'
  }

  return error.message || 'Проверьте соединение и попробуйте ещё раз.'
}
