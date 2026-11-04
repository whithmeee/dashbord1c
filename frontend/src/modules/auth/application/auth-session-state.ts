import type { AuthSession } from '../domain/auth-session'

type StateError = {
  readonly error?: Error
}

export type AuthSessionState =
  | { readonly status: 'checking' }
  | ({ readonly status: 'guest' } & StateError)
  | { readonly status: 'signing-in' }
  | ({
      readonly status: 'verification-required-owner'
      readonly session: Extract<AuthSession, { type: 'company' }>
      readonly message?: string
    } & StateError)
  | ({
      readonly status: 'verification-required-employee'
      readonly session: Extract<AuthSession, { type: 'employee' }>
    } & StateError)
  | ({
      readonly status: 'authenticated-client'
      readonly session: Extract<AuthSession, { type: 'company' | 'employee' }>
    } & StateError)
  | ({
      readonly status: 'authenticated-admin-unavailable'
      readonly session: Extract<AuthSession, { type: 'admin' }>
    } & StateError)
  | { readonly status: 'unavailable'; readonly error: Error }

export function withStateError(
  state: AuthSessionState,
  error: Error,
): AuthSessionState {
  switch (state.status) {
    case 'guest':
    case 'verification-required-owner':
    case 'verification-required-employee':
    case 'authenticated-client':
    case 'authenticated-admin-unavailable':
      return { ...state, error }
    case 'checking':
    case 'signing-in':
    case 'unavailable':
      return { status: 'unavailable', error }
  }
}
