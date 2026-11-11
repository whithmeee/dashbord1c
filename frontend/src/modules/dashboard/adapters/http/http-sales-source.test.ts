import { describe, expect, it, vi } from 'vitest'
import { ApiError, type ApiClient } from '../../../../shared/api'
import { createHttpSalesSource } from './http-sales-source'

const response = {
  integration_id: 7,
  available_period: { to: '2025-08-31' },
  period: { from: '2025-03-01', to: '2025-08-31' },
  financial_status: 'available',
  financial_status_code: null,
  money: { currency_key: 'rub', currency: 'руб.', currency_status: 'separated_by_document_currency', amount_scale: null, unit: 'odata_document_amount' },
  currencies: [{ key: 'rub', name: 'руб.', document_count: 1 }],
  metrics: { sales_documents: 1, customers: 1, organizations: 1 },
  monthly: [],
  customers: [],
  organizations: [],
  receipts: [],
  payments: [],
  total_amount: '0.00',
}

describe('financial sales HTTP source', () => {
  it('requests the exact endpoint and query parameters with AbortSignal', async () => {
    const get = vi.fn().mockResolvedValue(response)
    const source = createHttpSalesSource({ get } as unknown as ApiClient)
    const signal = new AbortController().signal

    await expect(source.get({ integrationId: 7, months: 6, currencyKey: 'rub' }, { signal }))
      .resolves.toMatchObject({ integrationId: 7, monthly: [] })
    expect(get).toHaveBeenCalledWith(
      '/cabinet/finance/sales?integration_id=7&months=6&currency_key=rub',
      { signal },
    )
  })

  it('preserves ApiError and does not retry', async () => {
    const error = new ApiError('Unavailable', { kind: 'http', status: 502, code: 'onec_unavailable' })
    const get = vi.fn().mockRejectedValue(error)
    const source = createHttpSalesSource({ get } as unknown as ApiClient)

    await expect(source.get({ integrationId: 7, months: 6 })).rejects.toBe(error)
    expect(get).toHaveBeenCalledTimes(1)
  })
})
