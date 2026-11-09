import type { ApiError } from '../../../shared/api'
import type { EmployeesGateway } from '../adapters/http/http-employees-gateway'
import type { EmployeeActivityProfile } from '../domain/employee-activity'

export type EmployeeActivityState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly employeeId: number }
  | { readonly status: 'success'; readonly employeeId: number; readonly profile: EmployeeActivityProfile }
  | { readonly status: 'error'; readonly employeeId: number; readonly error: Error }

export interface EmployeeActivityStore {
  getSnapshot(): EmployeeActivityState
  subscribe(listener: () => void): () => void
  load(employeeId: number): Promise<void>
  reset(): void
}

export function createEmployeeActivityStore(
  gateway: EmployeesGateway,
  session: { expireSession(): void } = { expireSession: () => undefined },
): EmployeeActivityStore {
  let state: EmployeeActivityState = { status: 'idle' }
  let revision = 0
  let request: Promise<void> | undefined
  let controller: AbortController | undefined
  const listeners = new Set<() => void>()

  function publish(next: EmployeeActivityState): void {
    state = next
    listeners.forEach((listener) => listener())
  }

  function load(employeeId: number): Promise<void> {
    if (state.status === 'loading' && state.employeeId === employeeId && request) return request

    controller?.abort()
    const currentRevision = ++revision
    const nextController = new AbortController()
    controller = nextController
    publish({ status: 'loading', employeeId })
    const nextRequest = gateway.activity(employeeId, { signal: nextController.signal })
      .then((profile) => {
        if (currentRevision === revision && !nextController.signal.aborted) publish({ status: 'success', employeeId, profile })
      })
      .catch((error: unknown) => {
        if (currentRevision !== revision || nextController.signal.aborted) return
        if ((error as ApiError | undefined)?.status === 401) {
          session.expireSession()
          reset()
          return
        }
        publish({ status: 'error', employeeId, error: error instanceof Error ? error : new Error('Activity request failed') })
      })
      .finally(() => {
        if (request === nextRequest) {
          request = undefined
          controller = undefined
        }
      })
    request = nextRequest
    return nextRequest
  }

  function reset(): void {
    revision += 1
    controller?.abort()
    request = undefined
    controller = undefined
    publish({ status: 'idle' })
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    load,
    reset,
  }
}
