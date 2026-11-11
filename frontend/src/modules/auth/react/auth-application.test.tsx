import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { AuthSessionState } from '../application/auth-session-state'
import type { AuthSessionStore } from '../application/auth-session-store'
import {
  adminSession,
  companySession,
  employeeSession,
  unverifiedCompanySession,
} from '../application/auth-session-store.test-data'
import { AuthStateView } from './auth-application'
import { ensureSessionRestore } from './auth-runtime'

function createStore(state: AuthSessionState): AuthSessionStore {
  return {
    getSnapshot: () => state,
    subscribe: vi.fn(() => vi.fn()),
    restore: vi.fn().mockResolvedValue(undefined),
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    verifyEmail: vi.fn().mockResolvedValue(undefined),
    resendEmailCode: vi.fn().mockResolvedValue('Код отправлен.'),
    expireSession: vi.fn(),
  }
}

function renderState(state: AuthSessionState): string {
  return renderToStaticMarkup(
    <AuthStateView
      state={state}
      store={createStore(state)}
      clientContent={<div>Защищённый кабинет</div>}
    />,
  )
}

describe('auth application guard', () => {
  it('does not render protected content while restoring a session', () => {
    const markup = renderState({ status: 'checking' })

    expect(markup).toContain('Проверяем сессию')
    expect(markup).not.toContain('Защищённый кабинет')
  })

  it('renders login for a guest and after an unauthorized restore', () => {
    const markup = renderState({ status: 'guest' })

    expect(markup).toContain('Добро пожаловать')
    expect(markup).not.toContain('Защищённый кабинет')
  })

  it.each([companySession, employeeSession])(
    'renders the client cabinet for an authorized client',
    (session) => {
      const markup = renderState({ status: 'authenticated-client', session })

      expect(markup).toContain('Защищённый кабинет')
    },
  )

  it('does not render the client cabinet for an admin', () => {
    const markup = renderState({
      status: 'authenticated-admin-unavailable',
      session: adminSession,
    })

    expect(markup).toContain('Администрирование')
    expect(markup).toContain('Компании')
    expect(markup).not.toContain('Защищённый кабинет')
  })

  it('separates owner and employee verification flows', () => {
    const owner = renderState({
      status: 'verification-required-owner',
      session: unverifiedCompanySession,
    })
    const employee = renderState({
      status: 'verification-required-employee',
      session: employeeSession,
    })

    expect(owner).toContain('Введите шестизначный код')
    expect(employee).toContain('Подтверждение ожидается от владельца')
    expect(employee).not.toContain('Введите шестизначный код')
    expect(owner).not.toContain('Защищённый кабинет')
  })

  it('renders retry after a temporary restore failure', () => {
    const markup = renderState({
      status: 'unavailable',
      error: new Error('offline'),
    })

    expect(markup).toContain('Повторить проверку')
    expect(markup).not.toContain('Защищённый кабинет')
  })

  it('starts restore once for the same store instance', () => {
    const store = createStore({ status: 'checking' })

    ensureSessionRestore(store)
    ensureSessionRestore(store)

    expect(store.restore).toHaveBeenCalledOnce()
  })
})
