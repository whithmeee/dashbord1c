import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api'
import type { SalesReport } from '../domain/financial-sales'
import type { SalesSource } from '../adapters/http/http-sales-source'
import { createFinancialSalesStore } from './financial-sales-store'

const report: SalesReport = {
  integrationId: 7,
  availablePeriod: { to: '2025-08-31' },
  period: { from: '2025-03-01', to: '2025-08-31' },
  financialStatus: 'available',
  financialStatusCode: null,
  money: { currencyKey: 'rub', currency: 'руб.', currencyStatus: 'separated_by_document_currency', amountScale: null, unit: 'odata_document_amount' },
  currencies: [{ key: 'rub', name: 'руб.', documentCount: 2 }],
  metrics: { salesDocuments: 2, customers: 2, organizations: 1 },
  monthly: [{ period: '2025-08', amount: 300.3, documentCount: 2 }],
  totalAmount: 300.3,
  customers: [],
  organizations: [],
  receipts: [],
  payments: [],
}

const active = { id: 7, name: 'Основная', configName: 'Бухгалтерия', connectedAt: null, isActive: true, status: 'active' as const }

function integrations(items = [active]) {
  let listener: () => void = () => undefined
  return {
    getSnapshot: () => ({ status: 'success' as const, items, checks: {} }),
    subscribe: (next: () => void) => { listener = next; return () => undefined },
    publish: () => listener(),
  }
}

describe('real financial analytics store', () => {
  it('loads the latest six months and reloads for another currency without mixing queries', async () => {
    const get = vi.fn().mockResolvedValue(report)
    const store = createFinancialSalesStore({ get } satisfies SalesSource, integrations(), { expireSession: vi.fn() })
    store.setIntegration(7)
    await store.load()
    expect(get).toHaveBeenLastCalledWith({ integrationId: 7, months: 6 }, expect.objectContaining({ signal: expect.any(AbortSignal) }))
    expect(store.getSnapshot()).toMatchObject({ status: 'success', report })

    store.setCurrency('eur')
    await store.load()
    expect(get).toHaveBeenLastCalledWith({ integrationId: 7, months: 6, currencyKey: 'eur' }, expect.any(Object))
  })

  it('changes the server period and deduplicates an identical completed query', async () => {
    const get = vi.fn().mockResolvedValue(report)
    const store = createFinancialSalesStore({ get } satisfies SalesSource, integrations(), { expireSession: vi.fn() })
    store.setIntegration(7)
    store.setMonths(3)
    await store.load()
    await store.load()
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith({ integrationId: 7, months: 3 }, expect.any(Object))
  })

  it('expires 401 sessions and clears data when the integration disappears', async () => {
    const expireSession = vi.fn()
    const unauthorized = new ApiError('Unauthenticated', { kind: 'http', status: 401 })
    const integrationStore = integrations()
    const store = createFinancialSalesStore({ get: vi.fn().mockRejectedValue(unauthorized) }, integrationStore, { expireSession })
    store.setIntegration(7)
    await store.load()
    expect(store.getSnapshot()).toEqual({ status: 'idle' })
    expect(expireSession).toHaveBeenCalledOnce()

    const successful = createFinancialSalesStore({ get: vi.fn().mockResolvedValue(report) }, integrationStore, { expireSession })
    successful.setIntegration(7)
    await successful.load()
    Object.assign(integrationStore, { getSnapshot: () => ({ status: 'success' as const, items: [], checks: {} }) })
    integrationStore.publish()
    expect(successful.getSnapshot()).toEqual({ status: 'idle' })
  })
})
