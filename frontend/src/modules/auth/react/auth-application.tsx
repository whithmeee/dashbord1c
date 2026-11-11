import { useEffect, useSyncExternalStore, type ReactNode } from 'react'
import App from '../../../App'
import { AdminPanel } from '../../admin/admin-panel'
import type { AuthSessionState } from '../application/auth-session-state'
import type { AuthSessionStore } from '../application/auth-session-store'
import { Auth } from '../auth'
import { EmailVerification } from './email-verification'
import { AuthStatusPage } from './auth-status-page'
import { synchronizeAuthPath } from './auth-navigation'
import { getAuthErrorMessage } from './auth-error-message'
import { authSessionStore, ensureSessionRestore } from './auth-runtime'

export function AuthApplication() {
  const store = authSessionStore
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  )

  useEffect(() => ensureSessionRestore(store), [store])
  useEffect(() => {
    const synchronize = () => synchronizeAuthPath(state)
    synchronize()
    window.addEventListener('popstate', synchronize)

    return () => window.removeEventListener('popstate', synchronize)
  }, [state])

  return (
    <AuthStateView
      state={state}
      store={store}
      clientContent={
        <App
          onLogout={() => store.logout()}
          logoutError={getAuthErrorMessage(
            'error' in state ? state.error : undefined,
          )}
        />
      }
    />
  )
}

type AuthStateViewProps = {
  state: AuthSessionState
  store: AuthSessionStore
  clientContent: ReactNode
}

export function AuthStateView({
  state,
  store,
  clientContent,
}: AuthStateViewProps) {
  switch (state.status) {
    case 'checking':
      return <AuthStatusPage title="Проверяем сессию" description="Это займёт несколько секунд." />
    case 'guest':
    case 'signing-in':
      return <Auth store={store} state={state} />
    case 'verification-required-owner':
      return <EmailVerification state={state} store={store} />
    case 'verification-required-employee':
      return (
        <AuthStatusPage
          title="Подтверждение ожидается от владельца"
          description="После подтверждения email компании повторите проверку доступа."
          actionLabel="Повторить проверку"
          onAction={() => void store.restore()}
        />
      )
    case 'authenticated-client':
      return clientContent
    case 'authenticated-admin-unavailable':
      return <AdminPanel key={state.session.account.id} account={state.session.account} auth={store} error={state.error} />
    case 'unavailable':
      return (
        <AuthStatusPage
          title="Сервис временно недоступен"
          description="Не удалось проверить сессию. Проверьте соединение и повторите попытку."
          actionLabel="Повторить проверку"
          onAction={() => void store.restore()}
        />
      )
  }
}
