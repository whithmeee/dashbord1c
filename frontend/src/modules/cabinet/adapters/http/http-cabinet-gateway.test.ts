import { describe, expect, it, vi } from 'vitest'
import type { ApiClient } from '../../../../shared/api'
import { ApiError } from '../../../../shared/api'
import { createHttpCabinetGateway } from './http-cabinet-gateway'

describe('createHttpCabinetGateway', () => {
  it('requests the dashboard endpoint with the provided signal', async () => {
    const get = vi.fn().mockResolvedValue({
      company: {
        id: 1,
        name: 'Осминог',
        email: 'owner@example.com',
        email_verified: true,
        subscription_status: 'active',
        phones: [],
        messengers: [],
        created_at: '2026-11-05T00:00:00Z',
      },
      integrations: { count: 0, active_count: 0, items: [] },
    })
    const gateway = createHttpCabinetGateway({ get } as unknown as ApiClient)
    const signal = new AbortController().signal

    await gateway.getDashboard({ signal })

    expect(get).toHaveBeenCalledWith('/cabinet/dashboard', { signal })
  })

  it('passes API errors through unchanged', async () => {
    const error = new ApiError('Forbidden', { kind: 'http', status: 403 })
    const gateway = createHttpCabinetGateway({
      get: vi.fn().mockRejectedValue(error),
    } as unknown as ApiClient)

    await expect(gateway.getDashboard()).rejects.toBe(error)
  })
})
