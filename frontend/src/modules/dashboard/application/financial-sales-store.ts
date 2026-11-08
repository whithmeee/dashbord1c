import type { ApiError } from '../../../shared/api'
import type { Integration } from '../../integrations/domain/integration'
import type { IntegrationsState } from '../../integrations/application/integrations-store'
import type { SalesReportPeriod, SalesReport } from '../domain/financial-sales'
import type { SalesReportQuery, SalesSource } from '../adapters/http/http-sales-source'

export type FinancialSalesState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | {
      readonly status: 'success'
      readonly report: SalesReport
      readonly integrationId: number
      readonly period: SalesReportPeriod
    }
  | { readonly status: 'error'; readonly error: Error }

export interface FinancialSalesIntegrationSource {
  getSnapshot(): IntegrationsState
  subscribe(listener: () => void): () => void
}

export interface FinancialSalesSessionDependency {
  expireSession(): void
}

export interface FinancialSalesStore {
  getSnapshot(): FinancialSalesState
  subscribe(listener: () => void): () => void
  load(): Promise<void>
  retry(): Promise<void>
  setIntegration(id: number): void
  setPeriod(from: string, to: string): void
  reset(): void
}

export type FinancialSalesStoreOptions = {
  initialIntegrationId?: number
  initialPeriod?: SalesReportPeriod
}

export function createFinancialSalesStore(
  source: SalesSource,
  integrations: FinancialSalesIntegrationSource,
  session: FinancialSalesSessionDependency,
  options: FinancialSalesStoreOptions = {},
): FinancialSalesStore {
  let state: FinancialSalesState = { status: 'idle' }
  let selectedIntegrationId = options.initialIntegrationId
  let period = options.initialPeriod
  let revision = 0
  let activeRequest: Promise<void> | undefined
  let activeController: AbortController | undefined
  const listeners = new Set<() => void>()

  function publish(nextState: FinancialSalesState): void {
    state = nextState
    listeners.forEach((listener) => listener())
  }

  function current(operationRevision: number): boolean {
    return revision === operationRevision
  }

  function load(): Promise<void> {
    reconcileIntegration()
    if (state.status === 'loading' && activeRequest) {
      return activeRequest
    }

    const query = currentQuery()
    if (!query) {
      return Promise.resolve()
    }

    if (state.status === 'success' && sameQuery(state, query)) {
      return Promise.resolve()
    }

    const operationRevision = ++revision
    activeController?.abort()
    const controller = new AbortController()
    activeController = controller
    publish({ status: 'loading' })

    const request = source.get(query, { signal: controller.signal })
      .then((report) => {
        if (current(operationRevision) && !controller.signal.aborted) {
          publish({
            status: 'success',
            report,
            integrationId: query.integrationId,
            period: { from: query.from, to: query.to },
          })
        }
      })
      .catch((error: unknown) => {
        if (!current(operationRevision) || controller.signal.aborted) {
          return
        }
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

  function setIntegration(id: number): void {
    if (selectedIntegrationId === id) {
      return
    }
    selectedIntegrationId = id
    invalidate()
  }

  function setPeriod(from: string, to: string): void {
    if (!isValidDateRange(from, to)) {
      period = undefined
      invalidate()
      publish({ status: 'error', error: new Error('Некорректный период отчёта') })
      return
    }

    if (period?.from === from && period.to === to) {
      return
    }
    period = { from, to }
    invalidate()
  }

  function reset(): void {
    revision += 1
    activeController?.abort()
    activeRequest = undefined
    activeController = undefined
    selectedIntegrationId = undefined
    period = undefined
    publish({ status: 'idle' })
  }

  function invalidate(): void {
    revision += 1
    activeController?.abort()
    activeRequest = undefined
    activeController = undefined
    publish({ status: 'idle' })
  }

  function reconcileIntegration(): void {
    if (selectedIntegrationId === undefined || isAvailable(selectedIntegrationId)) {
      return
    }
    selectedIntegrationId = undefined
    invalidate()
  }

  function isAvailable(id: number): boolean {
    const snapshot = integrations.getSnapshot()
    return snapshot.status === 'success' && snapshot.items.some(isActive(id))
  }

  function currentQuery(): SalesReportQuery | undefined {
    if (selectedIntegrationId === undefined || period === undefined || !isAvailable(selectedIntegrationId)) {
      return undefined
    }
    return { integrationId: selectedIntegrationId, ...period }
  }

  integrations.subscribe(reconcileIntegration)

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    load,
    retry: load,
    setIntegration,
    setPeriod,
    reset,
  }
}

function sameQuery(state: Extract<FinancialSalesState, { status: 'success' }>, query: SalesReportQuery): boolean {
  return state.integrationId === query.integrationId
    && state.period.from === query.from
    && state.period.to === query.to
}

function isActive(id: number) {
  return (integration: Integration): boolean => integration.id === id && integration.isActive && integration.status === 'active'
}

function isValidDateRange(from: string, to: string): boolean {
  return isDate(from) && isDate(to) && from <= to
}

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Financial sales request failed')
}

function isUnauthorized(error: unknown): boolean {
  return (error as ApiError | undefined)?.status === 401
}
