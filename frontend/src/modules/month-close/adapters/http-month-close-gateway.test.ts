import { describe, expect, it, vi } from 'vitest'
import type { ApiClient } from '../../../shared/api'
import { monthCloseDetailsResponse, monthCloseSummaryResponse } from '../testing/month-close-fixture'
import { createHttpMonthCloseGateway } from './http-month-close-gateway'

describe('month close HTTP gateway', () => {
  it('uses summary, refresh and detail endpoints with AbortSignal', async () => {
    const get = vi.fn()
      .mockResolvedValueOnce(monthCloseSummaryResponse)
      .mockResolvedValueOnce(monthCloseSummaryResponse)
      .mockResolvedValueOnce(monthCloseDetailsResponse)
    const gateway = createHttpMonthCloseGateway({ get } as unknown as ApiClient)
    const signal = new AbortController().signal

    await gateway.summary(7, '2026-10', false, { signal })
    await gateway.summary(7, '2026-10', true, { signal })
    await gateway.details(7, '2026-10', 'unposted', { signal })

    expect(get).toHaveBeenNthCalledWith(1, '/api/month-close?integration_id=7&month=2026-10', { signal })
    expect(get).toHaveBeenNthCalledWith(2, '/api/month-close?integration_id=7&month=2026-10&refresh=1', { signal })
    expect(get).toHaveBeenNthCalledWith(3, '/api/month-close/checks/unposted?integration_id=7&month=2026-10', { signal })
  })
})
