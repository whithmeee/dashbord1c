import type { ApiError, RequestOptions } from '../../../shared/api'
import type { DataQualityReport } from '../domain/data-quality'

export interface DataQualityGateway {
  load(integrationId: number, refresh: boolean, options?: RequestOptions): Promise<DataQualityReport>
}

export interface DataQualitySessionDependency {
  expireSession(): void
}

export type DataQualityState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly integrationId: number }
  | { readonly status: 'success'; readonly report: DataQualityReport }
  | { readonly status: 'error'; readonly integrationId: number; readonly error: Error }

export interface DataQualityStore {
  getSnapshot(): DataQualityState
  subscribe(listener: () => void): () => void
  load(integrationId: number): Promise<void>
  refresh(): Promise<void>
  reset(): void
}

export function createDataQualityStore(
  gateway: DataQualityGateway,
  session: DataQualitySessionDependency,
): DataQualityStore {
  let state: DataQualityState = { status: 'idle' }
  let currentIntegrationId: number | undefined
  let request: Promise<void> | undefined
  let controller: AbortController | undefined
  let revision = 0
  const listeners = new Set<() => void>()

  function publish(next: DataQualityState): void {
    state = next
    listeners.forEach((listener) => listener())
  }

  function execute(integrationId: number, refresh: boolean): Promise<void> {
    if (request && state.status === 'loading' && state.integrationId === integrationId) return request

    controller?.abort()
    controller = new AbortController()
    currentIntegrationId = integrationId
    const operationRevision = ++revision
    publish({ status: 'loading', integrationId })

    const operation = gateway.load(integrationId, refresh, { signal: controller.signal })
      .then((report) => {
        if (operationRevision === revision) publish({ status: 'success', report })
      })
      .catch((error: unknown) => {
        if (operationRevision !== revision || controller?.signal.aborted) return
        if ((error as ApiError | undefined)?.status === 401) {
          publish({ status: 'idle' })
          session.expireSession()
          return
        }
        publish({ status: 'error', integrationId, error: normalizeError(error) })
      })
      .finally(() => {
        if (request === operation) request = undefined
      })

    request = operation
    return operation
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    load: (integrationId) => execute(integrationId, false),
    refresh: () => currentIntegrationId === undefined
      ? Promise.resolve()
      : execute(currentIntegrationId, true),
    reset() {
      revision += 1
      controller?.abort()
      controller = undefined
      request = undefined
      currentIntegrationId = undefined
      publish({ status: 'idle' })
    },
  }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Data quality request failed')
}
