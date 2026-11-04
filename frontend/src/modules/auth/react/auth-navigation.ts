import type { AuthSessionState } from '../application/auth-session-state'

export function getRequiredAuthPath(
  state: AuthSessionState,
): '/auth' | '/' | undefined {
  switch (state.status) {
    case 'guest':
    case 'signing-in':
    case 'verification-required-owner':
    case 'verification-required-employee':
      return '/auth'
    case 'authenticated-client':
    case 'authenticated-admin-unavailable':
      return '/'
    case 'checking':
    case 'unavailable':
      return undefined
  }
}

export function synchronizeAuthPath(state: AuthSessionState): void {
  const requiredPath = getRequiredAuthPath(state)
  if (requiredPath && window.location.pathname !== requiredPath) {
    window.history.replaceState(null, '', requiredPath)
  }
}
