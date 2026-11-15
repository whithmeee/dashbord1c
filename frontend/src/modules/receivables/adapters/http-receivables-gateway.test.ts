import { describe, expect, it, vi } from 'vitest'
import type { ApiClient } from '../../../shared/api'
import { receivablesDetailsResponse, receivablesSummaryResponse } from '../testing/receivables-fixture'
import { createHttpReceivablesGateway } from './http-receivables-gateway'

describe('http receivables gateway', () => {
  it('requests the summary with refresh and the check details for a month', async () => {
    const get = vi.fn().mockResolvedValueOnce(receivablesSummaryResponse).mockResolvedValueOnce(receivablesDetailsResponse)
    const gateway = createHttpReceivablesGateway({ get } as unknown as ApiClient)

    await gateway.summary(7, '2026-10', true)
    await gateway.details(7, '2026-10', 'partial')

    expect(get).toHaveBeenNthCalledWith(1, '/api/receivables?integration_id=7&month=2026-10&refresh=1', {})
    expect(get).toHaveBeenNthCalledWith(2, '/api/receivables/checks/partial?integration_id=7&month=2026-10', {})
  })
})
