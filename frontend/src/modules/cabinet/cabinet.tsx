import { useEffect, useRef, useSyncExternalStore } from 'react'
import { AlertCircle, LoaderCircle, RotateCcw } from 'lucide-react'
import { authSessionStore } from '../auth/react/auth-runtime'
import { cabinetDashboardStore } from './cabinet-runtime'
import { resetIntegrations } from '../integrations/integrations-runtime'
import { CabinetPage } from './presentation/shell/cabinet-page'
import './cabinet-state.css'

export function Cabinet({ onOpenChat }: { onOpenChat: () => void }) {
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
  const sessionKey = getSessionKey(authState)
  const previousSessionKey = useRef<string>()

  useEffect(() => {
    if (!sessionKey) {
      resetIntegrations()
      if (dashboardState.status !== 'idle') {
        cabinetDashboardStore.reset()
      }
      return
    }

    if (previousSessionKey.current !== sessionKey) {
      previousSessionKey.current = sessionKey
      resetIntegrations()
      cabinetDashboardStore.reset()
      void cabinetDashboardStore.load()
    }
  }, [dashboardState.status, sessionKey])

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

  return <CabinetPage dashboard={dashboardState.data} onOpenChat={onOpenChat} />
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
          <p>{error?.message || 'Проверьте соединение и попробуйте ещё раз.'}</p>
          <button className="cabinet-button cabinet-button-primary" type="button" onClick={onRetry}>
            <RotateCcw size={16} />
            Повторить
          </button>
        </>
      )}
    </section>
  )
}
