import { ApiError } from '../../../shared/api'
import type { AuthSession } from '../domain/auth-session'
import type { AuthGateway, LoginCredentials } from './auth-gateway'
import { type AuthSessionState, withStateError } from './auth-session-state'
import { createAuthSessionVerification } from './auth-session-verification'

export interface AuthSessionStore {
  getSnapshot(): AuthSessionState
  subscribe(listener: () => void): () => void
  restore(): Promise<void>
  login(credentials: LoginCredentials): Promise<void>
  logout(): Promise<void>
  verifyEmail(code: string): Promise<void>
  resendEmailCode(): Promise<string>
  expireSession(): void
}

export function createAuthSessionStore(gateway: AuthGateway): AuthSessionStore {
  let state: AuthSessionState = { status: 'checking' }
  let revision = 0
  let restoreRequest: Promise<void> | undefined
  let loginRequest: Promise<void> | undefined
  const listeners = new Set<() => void>()

  function publish(nextState: AuthSessionState): void {
    state = nextState
    listeners.forEach((listener) => listener())
  }

  function current(operationRevision: number): boolean {
    return revision === operationRevision
  }

  async function resolveSession(session: AuthSession): Promise<AuthSessionState> {
    switch (session.type) {
      case 'company':
        return session.account.emailVerified
          ? { status: 'authenticated-client', session }
          : { status: 'verification-required-owner', session }
      case 'admin':
        return { status: 'authenticated-admin-unavailable', session }
      case 'employee': {
        const access = await gateway.probeEmployeeAccess()

        return access === 'allowed'
          ? { status: 'authenticated-client', session }
          : { status: 'verification-required-employee', session }
      }
    }
  }

  function normalizeError(error: unknown): Error {
    return error instanceof Error ? error : new Error('Unknown auth failure')
  }

  async function restoreSession(operationRevision: number): Promise<void> {
    try {
      const session = await gateway.getSession()
      const nextState = await resolveSession(session)
      if (current(operationRevision)) {
        publish(nextState)
      }
    } catch (error) {
      if (!current(operationRevision)) {
        return
      }
      if (error instanceof ApiError && error.status === 401) {
        publish({ status: 'guest' })
        return
      }
      publish({ status: 'unavailable', error: normalizeError(error) })
    }
  }

  function restore(): Promise<void> {
    if (restoreRequest) {
      return restoreRequest
    }
    const request = restoreSession(revision).finally(() => {
      if (restoreRequest === request) {
        restoreRequest = undefined
      }
    })
    restoreRequest = request

    return request
  }

  function login(credentials: LoginCredentials): Promise<void> {
    if (loginRequest) {
      return loginRequest
    }
    const operationRevision = ++revision
    publish({ status: 'signing-in' })
    const request = gateway.login(credentials)
      .then(resolveSession)
      .then((nextState) => {
        if (current(operationRevision)) {
          publish(nextState)
        }
      })
      .catch((error: unknown) => {
        if (current(operationRevision)) {
          publish({ status: 'guest', error: normalizeError(error) })
        }
        throw error
      })
      .finally(() => {
        if (loginRequest === request) {
          loginRequest = undefined
        }
      })
    loginRequest = request

    return request
  }

  async function logout(): Promise<void> {
    const operationRevision = ++revision
    const previousState = state
    try {
      await gateway.logout()
      if (current(operationRevision)) {
        publish({ status: 'guest' })
      }
    } catch (error) {
      if (!current(operationRevision)) {
        return
      }
      if (error instanceof ApiError && error.status === 401) {
        publish({ status: 'guest' })
        return
      }
      publish(withStateError(previousState, normalizeError(error)))
      throw error
    }
  }

  const verification = createAuthSessionVerification({
    gateway,
    getState: () => state,
    resolveSession,
    publish,
    startOperation: () => ++revision,
    isCurrent: current,
  })

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    restore,
    login,
    logout,
    verifyEmail: verification.verifyEmail,
    resendEmailCode: verification.resendEmailCode,
    expireSession() {
      revision += 1
      publish({ status: 'guest' })
    },
  }
}
