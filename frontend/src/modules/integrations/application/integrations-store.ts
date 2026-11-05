import type { ApiError } from '../../../shared/api'
import type { IntegrationGateway } from '../adapters/http/http-integration-gateway'
import type { Integration, IntegrationCheck } from '../domain/integration'

export type IntegrationCheckState =
  | { readonly status: 'not_checked' }
  | { readonly status: 'checking' }
  | ({ readonly status: IntegrationCheck['status']; readonly checkedAt: string })
  | { readonly status: 'error'; readonly error: Error }

export type IntegrationsState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | {
      readonly status: 'success'
      readonly items: readonly Integration[]
      readonly checks: Readonly<Record<number, IntegrationCheckState>>
    }
  | { readonly status: 'error'; readonly error: Error; readonly sessionExpired?: boolean }

export interface IntegrationsSessionDependency {
  expireSession(): void
}

export interface IntegrationsStore {
  getSnapshot(): IntegrationsState
  subscribe(listener: () => void): () => void
  load(): Promise<void>
  retry(): Promise<void>
  check(id: number): Promise<void>
  reset(): void
}

type CheckRequest = {
  readonly promise: Promise<void>
  readonly controller: AbortController
  readonly revision: number
}

export function createIntegrationsStore(
  gateway: IntegrationGateway,
  session: IntegrationsSessionDependency,
): IntegrationsStore {
  let state: IntegrationsState = { status: 'idle' }
  let revision = 0
  let listRequest: Promise<void> | undefined
  let listController: AbortController | undefined
  const checks = new Map<number, CheckRequest>()
  const listeners = new Set<() => void>()

  function publish(nextState: IntegrationsState): void {
    state = nextState
    listeners.forEach((listener) => listener())
  }

  function load(): Promise<void> {
    if (state.status === 'loading' && listRequest) {
      return listRequest
    }

    const operationRevision = ++revision
    abortChecks()
    const previousChecks = state.status === 'success' ? state.checks : {}
    const controller = new AbortController()
    listController = controller
    publish({ status: 'loading' })

    const request = gateway.list({ signal: controller.signal })
      .then((items) => {
        if (!isCurrent(operationRevision)) {
          return
        }

        const itemIds = new Set(items.map((item) => item.id))
        const retainedChecks = Object.fromEntries(
          Object.entries(previousChecks).filter(([id]) => itemIds.has(Number(id))),
        )
        publish({ status: 'success', items, checks: retainedChecks })
      })
      .catch((error: unknown) => {
        if (!isCurrent(operationRevision) || controller.signal.aborted) {
          return
        }

        if (isUnauthorized(error)) {
          publish({ status: 'idle' })
          session.expireSession()
          return
        }

        publish({ status: 'error', error: normalizeError(error) })
      })
      .finally(() => {
        if (listRequest === request) {
          listRequest = undefined
          listController = undefined
        }
      })

    listRequest = request
    return request
  }

  function check(id: number): Promise<void> {
    if (state.status !== 'success' || !state.items.some((item) => item.id === id)) {
      return Promise.resolve()
    }

    const existing = checks.get(id)
    if (existing) {
      return existing.promise
    }

    const operationRevision = revision
    const controller = new AbortController()
    publishCheck(id, { status: 'checking' })

    const request = gateway.check(id, { signal: controller.signal })
      .then((result) => {
        if (isCurrent(operationRevision) && hasIntegration(id)) {
          publishCheck(id, toCheckState(result))
        }
      })
      .catch((error: unknown) => {
        if (!isCurrent(operationRevision) || controller.signal.aborted) {
          return
        }

        if (isUnauthorized(error)) {
          publish({ status: 'idle' })
          session.expireSession()
          return
        }

        publishCheck(id, { status: 'error', error: normalizeError(error) })
      })
      .finally(() => {
        if (checks.get(id)?.promise === request) {
          checks.delete(id)
        }
      })

    checks.set(id, { promise: request, controller, revision: operationRevision })
    return request
  }

  function reset(): void {
    revision += 1
    listController?.abort()
    listRequest = undefined
    listController = undefined
    abortChecks()
    publish({ status: 'idle' })
  }

  function abortChecks(): void {
    checks.forEach(({ controller }) => controller.abort())
    checks.clear()
  }

  function isCurrent(operationRevision: number): boolean {
    return revision === operationRevision
  }

  function hasIntegration(id: number): boolean {
    return state.status === 'success' && state.items.some((item) => item.id === id)
  }

  function publishCheck(id: number, checkState: IntegrationCheckState): void {
    if (state.status !== 'success') {
      return
    }

    publish({ ...state, checks: { ...state.checks, [id]: checkState } })
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    load,
    retry: load,
    check,
    reset,
  }
}

function toCheckState(result: IntegrationCheck): IntegrationCheckState {
  return { status: result.status, checkedAt: result.checkedAt }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Integration request failed')
}

function isUnauthorized(error: unknown): boolean {
  return (error as ApiError | undefined)?.status === 401
}
