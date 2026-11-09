import { useEffect, useRef, useSyncExternalStore } from 'react'
import { AlertCircle, LoaderCircle, RotateCcw } from 'lucide-react'
import { describeError } from '../../shared/api'
import { sectionAccessFor } from '../auth/domain/section-access'
import { authSessionStore } from '../auth/react/auth-runtime'
import { cabinetDashboardStore } from './cabinet-runtime'
import { cabinetDetailsStore, resetCabinetDetails } from './cabinet-details-runtime'
import { resetCabinetStatistics } from './cabinet-statistics-runtime'
import { resetIntegrations } from '../integrations/integrations-runtime'
import { resetEmployees } from '../employees/employees-runtime'
import { CabinetPage } from './presentation/shell/cabinet-page'
import './cabinet-state.css'

export function Cabinet() {
  const authState = useSyncExternalStore(
    authSessionStore.subscribe,
    authSessionStore.getSnapshot,
    authSessionStore.getSnapshot,
  )
  const dashboardState = useSyncExternalStore(
    cabinetDashboardStore.subscribe,
    cabinetDashboardStore.getSnapshot,
    cabinetDashboardStore.getSnapshot,
  )
  const detailsState = useSyncExternalStore(
    cabinetDetailsStore.subscribe,
    cabinetDetailsStore.getSnapshot,
    cabinetDetailsStore.getSnapshot,
  )
  const sessionKey = getSessionKey(authState)
  const session = authState.status === 'authenticated-client' ? authState.session : undefined
  const previousSessionKey = useRef<string>()

  useEffect(() => {
    if (!sessionKey) {
      resetIntegrations()
      resetEmployees()
      if (dashboardState.status !== 'idle') {
        cabinetDashboardStore.reset()
      }
      if (detailsState.status !== 'idle') resetCabinetDetails()
      resetCabinetStatistics()
      return
    }

    if (previousSessionKey.current !== sessionKey) {
      previousSessionKey.current = sessionKey
      resetIntegrations()
      resetEmployees()
      cabinetDashboardStore.reset()
      resetCabinetDetails()
      resetCabinetStatistics()
      void cabinetDashboardStore.load()
      void cabinetDetailsStore.load(
        sectionAccessFor(session),
      )
    }
  }, [dashboardState.status, detailsState.status, session, sessionKey])

  if (dashboardState.status === 'idle' || dashboardState.status === 'loading') {
    return <CabinetState status="loading" />
  }

  if (dashboardState.status === 'error') {
    return (
      <CabinetState
        status="error"
        error={dashboardState.error}
        onRetry={() => void cabinetDashboardStore.retry()}
      />
    )
  }

  const canManageEmployees = authState.status === 'authenticated-client'
    && authState.session.type === 'company'

  return <CabinetPage dashboard={dashboardState.data} detailsState={detailsState} canManageEmployees={canManageEmployees} onRetryDetails={() => void cabinetDetailsStore.retry()} />
}

function getSessionKey(state: ReturnType<typeof authSessionStore.getSnapshot>): string | undefined {
  if (state.status !== 'authenticated-client') {
    return undefined
  }

  return `${state.session.type}:${state.session.account.id}`
}

function CabinetState({
  status,
  error,
  onRetry,
}: {
  status: 'loading' | 'error'
  error?: Error
  onRetry?: () => void
}) {
  return (
    <section className="cabinet cabinet-state" data-testid={`cabinet-${status}`}>
      {status === 'loading' ? (
        <>
          <LoaderCircle className="cabinet-state-icon cabinet-state-spinner" size={28} />
          <h1>Загружаем кабинет</h1>
          <p>Получаем актуальные данные компании.</p>
        </>
      ) : (
        <>
          <AlertCircle className="cabinet-state-icon" size={28} />
          <h1>Не удалось загрузить кабинет</h1>
          <p>{describeError(error)}</p>
          <button className="cabinet-button cabinet-button-primary" type="button" onClick={onRetry}>
            <RotateCcw size={16} />
            Повторить
          </button>
        </>
      )}
    </section>
  )
}
