import { describe, expect, it, vi } from 'vitest'
import type { ApiClient } from '../../../../shared/api'
import { createHttpCabinetDetailsGateway } from './http-cabinet-details-gateway'

describe('createHttpCabinetDetailsGateway', () => {
  it('requests all cabinet detail endpoints with typed mapping', async () => {
    const get = vi.fn()
      .mockResolvedValueOnce({ status: 'operational', message: 'ok', total: 0, active_count: 0, inactive_count: 0, integrations: [] })
      .mockResolvedValueOnce({ status: 'active', state: 'active', starts_at: '2026-01-01', ends_at: '2026-12-31', total_days: 365, elapsed_days: 10, days_left: 355, progress_percent: 3, expires_soon: false })
      .mockResolvedValueOnce({ period: { from: '2026-01-01', to: '2026-01-31', group: 'day' }, total: 0, summary: { average_per_day: 0, active_days: 0, peak_day: null, last_request_at: null }, by_period: [], by_integration: [] })
    const gateway = createHttpCabinetDetailsGateway({ get } as unknown as ApiClient)
    const signal = new AbortController().signal

    await gateway.getSystemStatus({ signal })
    await gateway.getSubscription({ signal })
    await gateway.getStatistics(undefined, { signal })

    expect(get.mock.calls.map(([path]) => path)).toEqual(['/cabinet/system-status', '/cabinet/subscription', '/cabinet/statistics?period=month'])
    expect(get).toHaveBeenLastCalledWith('/cabinet/statistics?period=month', { signal })
  })
})
