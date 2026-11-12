import type { ApiError, RequestOptions } from '../../../shared/api'
import type { MonthCloseDetails, MonthCloseSummary } from '../domain/month-close'

export interface MonthCloseGateway {
  summary(integrationId: number, month: string, refresh: boolean, options?: RequestOptions): Promise<MonthCloseSummary>
  details(integrationId: number, month: string, check: string, options?: RequestOptions): Promise<MonthCloseDetails>
}

export type MonthCloseDetailsState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly check: string }
  | { readonly status: 'success'; readonly value: MonthCloseDetails }
  | { readonly status: 'error'; readonly check: string; readonly error: Error }

export type MonthCloseState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly integrationId: number; readonly month: string; readonly previous?: MonthCloseSummary }
  | { readonly status: 'success'; readonly summary: MonthCloseSummary; readonly details: MonthCloseDetailsState }
  | { readonly status: 'error'; readonly integrationId: number; readonly month: string; readonly error: Error }

export interface MonthCloseStore {
  getSnapshot(): MonthCloseState
  subscribe(listener: () => void): () => void
  load(integrationId: number, month: string): Promise<void>
  scan(): Promise<void>
  openCheck(check: string): Promise<void>
  closeDetails(): void
  reset(): void
}

export function createMonthCloseStore(gateway: MonthCloseGateway, session: { expireSession(): void }): MonthCloseStore {
  let state: MonthCloseState = { status: 'idle' }
  let selection: { integrationId: number; month: string } | undefined
  let request: Promise<void> | undefined
  let controller: AbortController | undefined
  let revision = 0
  const listeners = new Set<() => void>()

  function publish(next: MonthCloseState): void {
    state = next
    listeners.forEach((listener) => listener())
  }

  function load(integrationId: number, month: string, refresh = false): Promise<void> {
    if (request && state.status === 'loading' && state.integrationId === integrationId && state.month === month) return request
    controller?.abort()
    selection = { integrationId, month }
    controller = new AbortController()
    const currentRevision = ++revision
    const previous = state.status === 'success' ? state.summary : undefined
    publish({ status: 'loading', integrationId, month, previous })
    const operation = gateway.summary(integrationId, month, refresh, { signal: controller.signal })
      .then((summary) => { if (currentRevision === revision) publish({ status: 'success', summary, details: { status: 'idle' } }) })
      .catch((error: unknown) => failSummary(error, currentRevision, integrationId, month))
      .finally(() => clear(operation))
    request = operation
    return operation
  }

  function openCheck(check: string): Promise<void> {
    if (state.status !== 'success' || !selection || request) return Promise.resolve()
    controller = new AbortController()
    const currentRevision = revision
    const summary = state.summary
    publish({ status: 'success', summary, details: { status: 'loading', check } })
    const operation = gateway.details(selection.integrationId, selection.month, check, { signal: controller.signal })
      .then((value) => { if (currentRevision === revision) publish({ status: 'success', summary, details: { status: 'success', value } }) })
      .catch((error: unknown) => failDetails(error, currentRevision, summary, check))
      .finally(() => clear(operation))
    request = operation
    return operation
  }

  function failSummary(error: unknown, currentRevision: number, integrationId: number, month: string): void {
    if (stale(currentRevision)) return
    if (unauthorized(error)) return expire()
    publish({ status: 'error', integrationId, month, error: normalizeError(error) })
  }

  function failDetails(error: unknown, currentRevision: number, summary: MonthCloseSummary, check: string): void {
    if (stale(currentRevision)) return
    if (unauthorized(error)) return expire()
    publish({ status: 'success', summary, details: { status: 'error', check, error: normalizeError(error) } })
  }

  function stale(currentRevision: number): boolean {
    return currentRevision !== revision || controller?.signal.aborted === true
  }

  function unauthorized(error: unknown): boolean {
    return (error as ApiError | undefined)?.status === 401
  }

  function expire(): void {
    publish({ status: 'idle' })
    session.expireSession()
  }

  function clear(operation: Promise<void>): void {
    if (request === operation) {
      request = undefined
      controller = undefined
    }
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    load: (integrationId, month) => load(integrationId, month),
    scan: () => selection ? load(selection.integrationId, selection.month, true) : Promise.resolve(),
    openCheck,
    closeDetails() {
      if (state.status !== 'success') return
      if (state.details.status === 'loading') {
        revision += 1
        controller?.abort()
        controller = undefined
        request = undefined
      }
      publish({ ...state, details: { status: 'idle' } })
    },
    reset() {
      revision += 1
      controller?.abort()
      controller = undefined
      request = undefined
      selection = undefined
      publish({ status: 'idle' })
    },
  }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Month close request failed')
}
