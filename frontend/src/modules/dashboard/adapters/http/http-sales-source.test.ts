import { describe, expect, it, vi } from 'vitest'
import { ApiError, type ApiClient } from '../../../../shared/api'
import { createHttpSalesSource } from './http-sales-source'

const response = {
  integration_id: 7,
  period: { from: '2026-10-01', to: '2026-10-31' },
  money: { currency: null, currency_status: 'not_provided_by_current_odata', amount_scale: 2, unit: 'minor_units' },
  monthly: [],
  total_amount_minor: 0,
  customers: [],
  customers_total_amount_minor: 0,
}

describe('financial sales HTTP source', () => {
  it('requests the exact endpoint and query parameters with AbortSignal', async () => {
    const get = vi.fn().mockResolvedValue(response)
    const source = createHttpSalesSource({ get } as unknown as ApiClient)
    const signal = new AbortController().signal

    await expect(source.get({ integrationId: 7, from: '2026-10-01', to: '2026-10-31' }, { signal }))
      .resolves.toMatchObject({ integrationId: 7, monthly: [] })
    expect(get).toHaveBeenCalledWith(
      '/cabinet/finance/sales?integration_id=7&from=2026-10-01&to=2026-10-31',
      { signal },
    )
  })

  it('preserves ApiError and does not retry', async () => {
    const error = new ApiError('Unavailable', { kind: 'http', status: 502, code: 'onec_unavailable' })
    const get = vi.fn().mockRejectedValue(error)
    const source = createHttpSalesSource({ get } as unknown as ApiClient)

    await expect(source.get({ integrationId: 7, from: '2026-10-01', to: '2026-10-31' })).rejects.toBe(error)
    expect(get).toHaveBeenCalledTimes(1)
  })
})
