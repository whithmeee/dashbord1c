import type { ApiError } from '../../../shared/api'
import type { CabinetGateway } from '../adapters/http/http-cabinet-gateway'
import type { CabinetDashboard } from '../domain/cabinet'

export type CabinetDashboardState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: CabinetDashboard }
  | {
      readonly status: 'error'
      readonly error: Error
      readonly sessionExpired?: boolean
    }

export interface CabinetSessionDependency {
  expireSession(): void
}

export interface CabinetDashboardStore {
  getSnapshot(): CabinetDashboardState
  subscribe(listener: () => void): () => void
  load(): Promise<void>
  retry(): Promise<void>
  reset(): void
}

export function createCabinetDashboardStore(
  gateway: CabinetGateway,
  session: CabinetSessionDependency,
): CabinetDashboardStore {
  let state: CabinetDashboardState = { status: 'idle' }
  let revision = 0
  let activeRequest: Promise<void> | undefined
  let activeController: AbortController | undefined
  const listeners = new Set<() => void>()

  function publish(nextState: CabinetDashboardState): void {
    state = nextState
    listeners.forEach((listener) => listener())
  }

  function isCurrent(operationRevision: number): boolean {
    return revision === operationRevision
  }

  function load(): Promise<void> {
    if (state.status === 'loading' && activeRequest) {
      return activeRequest
    }

    const operationRevision = ++revision
    const controller = new AbortController()
    activeController = controller
    publish({ status: 'loading' })

    const request = gateway
      .getDashboard({ signal: controller.signal })
      .then((data) => {
        if (isCurrent(operationRevision)) {
          publish({ status: 'success', data })
        }
      })
      .catch((error: unknown) => {
        if (!isCurrent(operationRevision) || controller.signal.aborted) {
          return
        }

        const normalizedError = normalizeError(error)
        const sessionExpired = isUnauthorized(error)
        publish({
          status: 'error',
          error: normalizedError,
          ...(sessionExpired ? { sessionExpired: true } : {}),
        })

        if (sessionExpired) {
          session.expireSession()
        }
      })
      .finally(() => {
        if (activeRequest === request) {
          activeRequest = undefined
          activeController = undefined
        }
      })

    activeRequest = request
    return request
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    load,
    retry: load,
    reset() {
      revision += 1
      activeController?.abort()
      activeRequest = undefined
      activeController = undefined
      publish({ status: 'idle' })
    },
  }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Cabinet dashboard request failed')
}

function isUnauthorized(error: unknown): boolean {
  return (error as ApiError | undefined)?.status === 401
}
