import type { AuthSession } from '../domain/auth-session'
import type { AuthGateway } from './auth-gateway'
import { type AuthSessionState, withStateError } from './auth-session-state'

type VerificationDependencies = {
  readonly gateway: AuthGateway
  readonly getState: () => AuthSessionState
  readonly resolveSession: (session: AuthSession) => Promise<AuthSessionState>
  readonly publish: (state: AuthSessionState) => void
  readonly startOperation: () => number
  readonly isCurrent: (revision: number) => boolean
}

export function createAuthSessionVerification({
  gateway,
  getState,
  resolveSession,
  publish,
  startOperation,
  isCurrent,
}: VerificationDependencies) {
  let verifyRequest: Promise<void> | undefined
  let resendRequest: Promise<string> | undefined

  function ownerError(action: string): Error | undefined {
    return getState().status === 'verification-required-owner'
      ? undefined
      : new Error(`Only a company owner can ${action}`)
  }

  function verifyEmail(code: string): Promise<void> {
    if (verifyRequest) {
      return verifyRequest
    }
    const restriction = ownerError('verify email')
    if (restriction) {
      return Promise.reject(restriction)
    }
    const operationRevision = startOperation()
    const request = gateway.verifyEmail(code)
      .then(resolveSession)
      .then((nextState) => {
        if (isCurrent(operationRevision)) {
          publish(nextState)
        }
      })
      .catch((error: unknown) => {
        if (isCurrent(operationRevision)) {
          publish(withStateError(getState(), normalizeError(error)))
        }
        throw error
      })
      .finally(() => {
        if (verifyRequest === request) {
          verifyRequest = undefined
        }
      })
    verifyRequest = request

    return request
  }

  function resendEmailCode(): Promise<string> {
    if (resendRequest) {
      return resendRequest
    }
    const restriction = ownerError('resend email verification')
    if (restriction) {
      return Promise.reject(restriction)
    }
    const operationRevision = startOperation()
    const request = gateway.resendEmailCode()
      .then((message) => {
        const currentState = getState()
        if (
          isCurrent(operationRevision) &&
          currentState.status === 'verification-required-owner'
        ) {
          publish({ ...currentState, message, error: undefined })
        }
        return message
      })
      .catch((error: unknown) => {
        if (isCurrent(operationRevision)) {
          publish(withStateError(getState(), normalizeError(error)))
        }
        throw error
      })
      .finally(() => {
        if (resendRequest === request) {
          resendRequest = undefined
        }
      })
    resendRequest = request

    return request
  }

  return { verifyEmail, resendEmailCode }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Unknown auth failure')
}
