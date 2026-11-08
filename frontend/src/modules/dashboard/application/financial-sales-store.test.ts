import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api'
import type { SalesReport } from '../domain/financial-sales'
import type { SalesSource } from '../adapters/http/http-sales-source'
import { createFinancialSalesStore } from './financial-sales-store'

const report: SalesReport = {
  integrationId: 7,
  period: { from: '2026-10-01', to: '2026-10-31' },
  financialStatus: 'available',
  financialStatusCode: null,
  money: { currency: 'RUB', currencyStatus: 'confirmed', amountScale: 2, unit: 'minor_units' },
  monthly: [{ period: '2026-10', amountMinor: 35035 }],
  totalAmountMinor: 35035,
  customers: [],
  customersTotalAmountMinor: 35035,
}

const active = { id: 7, name: 'Основная', configName: 'Бухгалтерия', isActive: true, status: 'active' as const }

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function integrations(items = [active]) {
  let listener: () => void = () => undefined
  return {
    getSnapshot: () => ({ status: 'success' as const, items, checks: {} }),
    subscribe: (next: () => void) => { listener = next; return () => undefined },
    publish: () => listener(),
  }
}

function source(overrides: Partial<SalesSource> = {}) {
  return { get: vi.fn().mockResolvedValue(report), ...overrides } satisfies SalesSource
}

const period = { from: '2026-10-01', to: '2026-10-31' }

describe('createFinancialSalesStore', () => {
  it('loads from idle to loading to success with selected integration and period', async () => {
    const sales = source()
    const store = createFinancialSalesStore(sales, integrations(), { expireSession: vi.fn() })

    store.setIntegration(7)
    store.setPeriod(period.from, period.to)
    const request = store.load()

    expect(store.getSnapshot()).toMatchObject({ status: 'loading' })
    await request
    expect(store.getSnapshot()).toEqual({ status: 'success', report, integrationId: 7, period })
    expect(sales.get).toHaveBeenCalledWith({ integrationId: 7, ...period }, expect.objectContaining({ signal: expect.any(AbortSignal) }))
  })

  it('does not call the source without an active selected integration', async () => {
    const sales = source()
    const store = createFinancialSalesStore(sales, integrations([]), { expireSession: vi.fn() })

    store.setPeriod(period.from, period.to)
    await store.load()

    expect(sales.get).not.toHaveBeenCalled()
    expect(store.getSnapshot()).toEqual({ status: 'idle' })
  })

  it('deduplicates the same load and cancels stale requests on selection changes', async () => {
    const first = deferred<SalesReport>()
    const second = deferred<SalesReport>()
    const sales = source({ get: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise) })
    const store = createFinancialSalesStore(sales, integrations(), { expireSession: vi.fn() })
    store.setIntegration(7)
    store.setPeriod(period.from, period.to)

    const firstRequest = store.load()
    expect(store.load()).toBe(firstRequest)
    store.setPeriod('2026-11-01', '2026-11-30')
    const secondRequest = store.load()
    first.resolve(report)
    second.resolve({ ...report, period: { from: '2026-11-01', to: '2026-11-30' } })
    await Promise.all([firstRequest, secondRequest])

    expect(sales.get).toHaveBeenCalledTimes(2)
    expect(store.getSnapshot()).toMatchObject({ status: 'success', period: { from: '2026-11-01', to: '2026-11-30' } })
  })

  it('treats empty reports as success and retries errors', async () => {
    const sales = source({ get: vi.fn().mockRejectedValueOnce(new Error('temporary')).mockResolvedValueOnce({ ...report, monthly: [], customers: [] }) })
    const store = createFinancialSalesStore(sales, integrations(), { expireSession: vi.fn() })
    store.setIntegration(7)
    store.setPeriod(period.from, period.to)

    await store.load()
    expect(store.getSnapshot()).toMatchObject({ status: 'error', error: expect.any(Error) })
    await store.retry()
    expect(store.getSnapshot()).toMatchObject({ status: 'success', report: { monthly: [], customers: [] } })
  })

  it('expires and clears the session on 401 but keeps other API errors local', async () => {
    const expireSession = vi.fn()
    const unauthorized = source({ get: vi.fn().mockRejectedValue(new ApiError('Unauthenticated', { kind: 'http', status: 401 })) })
    const unauthorizedStore = createFinancialSalesStore(unauthorized, integrations(), { expireSession })
    unauthorizedStore.setIntegration(7)
    unauthorizedStore.setPeriod(period.from, period.to)
    await unauthorizedStore.load()
    expect(unauthorizedStore.getSnapshot()).toEqual({ status: 'idle' })
    expect(expireSession).toHaveBeenCalledOnce()

    const forbidden = source({ get: vi.fn().mockRejectedValue(new ApiError('Forbidden', { kind: 'http', status: 403 })) })
    const forbiddenStore = createFinancialSalesStore(forbidden, integrations(), { expireSession })
    forbiddenStore.setIntegration(7)
    forbiddenStore.setPeriod(period.from, period.to)
    await forbiddenStore.load()
    expect(forbiddenStore.getSnapshot()).toMatchObject({ status: 'error', error: expect.any(Error) })
    expect(expireSession).toHaveBeenCalledOnce()
  })

  it('rejects invalid periods and resets selection/data when integration disappears', async () => {
    const sales = source()
    const integrationStore = integrations()
    const store = createFinancialSalesStore(sales, integrationStore, { expireSession: vi.fn() })
    store.setIntegration(7)
    store.setPeriod('2026-11-31', '2026-11-01')
    await store.load()
    expect(store.getSnapshot()).toMatchObject({ status: 'error' })
    expect(sales.get).not.toHaveBeenCalled()

    store.setPeriod(period.from, period.to)
    await store.load()
    expect(store.getSnapshot().status).toBe('success')
    Object.assign(integrationStore, { getSnapshot: () => ({ status: 'success' as const, items: [], checks: {} }) })
    integrationStore.publish()
    expect(store.getSnapshot()).toEqual({ status: 'idle' })
  })
})
