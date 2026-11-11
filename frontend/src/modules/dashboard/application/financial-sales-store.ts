import type { ApiError } from '../../../shared/api'
import type { Integration } from '../../integrations/domain/integration'
import type { IntegrationsState } from '../../integrations/application/integrations-store'
import type { SalesReport } from '../domain/financial-sales'
import type { SalesReportQuery, SalesSource } from '../adapters/http/http-sales-source'

export type FinancialSalesState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly report: SalesReport; readonly query: SalesReportQuery }
  | { readonly status: 'error'; readonly error: Error }

export interface FinancialSalesIntegrationSource {
  getSnapshot(): IntegrationsState
  subscribe(listener: () => void): () => void
}

export interface FinancialSalesSessionDependency { expireSession(): void }

export interface FinancialSalesStore {
  getSnapshot(): FinancialSalesState
  subscribe(listener: () => void): () => void
  load(): Promise<void>
  retry(): Promise<void>
  setIntegration(id: number): void
  setMonths(months: 3 | 6): void
  setCurrency(currencyKey: string): void
  reset(): void
}

export function createFinancialSalesStore(
  source: SalesSource,
  integrations: FinancialSalesIntegrationSource,
  session: FinancialSalesSessionDependency,
): FinancialSalesStore {
  let state: FinancialSalesState = { status: 'idle' }
  let integrationId: number | undefined
  let months: 3 | 6 = 6
  let currencyKey: string | undefined
  let revision = 0
  let activeRequest: Promise<void> | undefined
  let activeController: AbortController | undefined
  const listeners = new Set<() => void>()

  function publish(next: FinancialSalesState): void {
    state = next
    listeners.forEach((listener) => listener())
  }

  function load(): Promise<void> {
    reconcileIntegration()
    if (state.status === 'loading' && activeRequest) return activeRequest
    const query = currentQuery()
    if (!query) return Promise.resolve()
    if (state.status === 'success' && sameQuery(state.query, query)) return Promise.resolve()

    const operationRevision = ++revision
    activeController?.abort()
    const controller = new AbortController()
    activeController = controller
    publish({ status: 'loading' })
    const request = source.get(query, { signal: controller.signal })
      .then((report) => {
        if (revision === operationRevision && !controller.signal.aborted) {
          currencyKey = report.money.currencyKey ?? currencyKey
          publish({
            status: 'success',
            report,
            query: { ...query, ...(currencyKey ? { currencyKey } : {}) },
          })
        }
      })
      .catch((error: unknown) => {
        if (revision !== operationRevision || controller.signal.aborted) return
        if (isUnauthorized(error)) {
          reset()
          session.expireSession()
          return
        }
        publish({ status: 'error', error: normalizeError(error) })
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

  function invalidate(): void {
    revision += 1
    activeController?.abort()
    activeRequest = undefined
    activeController = undefined
    publish({ status: 'idle' })
  }

  function reset(): void {
    integrationId = undefined
    months = 6
    currencyKey = undefined
    invalidate()
  }

  function isAvailable(id: number): boolean {
    const snapshot = integrations.getSnapshot()
    return snapshot.status === 'success'
      && snapshot.items.some((item: Integration) => item.id === id && item.isActive && item.status === 'active')
  }

  function reconcileIntegration(): void {
    if (integrationId !== undefined && !isAvailable(integrationId)) {
      integrationId = undefined
      currencyKey = undefined
      invalidate()
    }
  }

  function currentQuery(): SalesReportQuery | undefined {
    return integrationId !== undefined && isAvailable(integrationId)
      ? { integrationId, months, ...(currencyKey ? { currencyKey } : {}) }
      : undefined
  }

  integrations.subscribe(reconcileIntegration)

  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    load,
    retry: load,
    setIntegration(id) {
      if (integrationId === id) return
      integrationId = id
      currencyKey = undefined
      invalidate()
    },
    setMonths(next) {
      if (months === next) return
      months = next
      invalidate()
    },
    setCurrency(next) {
      if (currencyKey === next) return
      currencyKey = next
      invalidate()
    },
    reset,
  }
}

function sameQuery(left: SalesReportQuery, right: SalesReportQuery): boolean {
  return left.integrationId === right.integrationId
    && left.months === right.months
    && left.currencyKey === right.currencyKey
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Financial analytics request failed')
}

function isUnauthorized(error: unknown): boolean {
  return (error as ApiError | undefined)?.status === 401
}
