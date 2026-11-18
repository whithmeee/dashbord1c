import { describe, expect, it, vi } from 'vitest'
import type { ApiClient } from '../../../shared/api'
import { ApiError } from '../../../shared/api'
import { createHttpDataQualityGateway } from './http-data-quality-gateway'

const summary = {
  integration_id: 2,
  checked_at: '2026-11-12T10:00:00Z',
  totals: { critical: 0, warning: 0, info: 0, checked_objects: 2, issues: 0 },
  capabilities: { tax_details: true, inn_validation: true, kpp_validation: true, legal_type: true, contracts: true },
}

describe('createHttpDataQualityGateway', () => {
  it('requests summary before issues and forwards AbortSignal', async () => {
    const get = vi.fn().mockResolvedValueOnce(summary).mockResolvedValueOnce({ integration_id: 2, checked_at: summary.checked_at, items: [] })
    const gateway = createHttpDataQualityGateway({ get } as unknown as ApiClient)
    const signal = new AbortController().signal

    await expect(gateway.load(2, true, { signal })).resolves.toMatchObject({ summary: { integrationId: 2 }, issues: [] })
    expect(get).toHaveBeenNthCalledWith(1, '/cabinet/data-quality/summary?integration_id=2&refresh=1', { signal })
    expect(get).toHaveBeenNthCalledWith(2, '/cabinet/data-quality/issues?integration_id=2', { signal })
  })

  it('patches the counterparty card with only the changed field', async () => {
    const patch = vi.fn().mockResolvedValue({ object_id: 'c1' })
    const gateway = createHttpDataQualityGateway({ patch } as unknown as ApiClient)
    const signal = new AbortController().signal

    await gateway.fixCounterparty(2, 'c1', { kpp: '770701001' }, { signal })
    await gateway.fixCounterparty(2, 'c1', { legalType: 'individual' })

    expect(patch).toHaveBeenNthCalledWith(1, '/cabinet/data-quality/counterparties/c1', { integration_id: 2, inn: undefined, kpp: '770701001', legal_type: undefined }, { signal })
    expect(patch).toHaveBeenNthCalledWith(2, '/cabinet/data-quality/counterparties/c1', { integration_id: 2, inn: undefined, kpp: undefined, legal_type: 'individual' }, undefined)
  })

  it('preserves ApiError', async () => {
    const error = new ApiError('Offline', { kind: 'http', status: 502 })
    const gateway = createHttpDataQualityGateway({ get: vi.fn().mockRejectedValue(error) } as unknown as ApiClient)

    await expect(gateway.load(2, false)).rejects.toBe(error)
  })
})
