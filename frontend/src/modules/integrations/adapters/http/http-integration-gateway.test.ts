import { describe, expect, it, vi } from 'vitest'
import type { ApiClient } from '../../../../shared/api'
import { ApiError } from '../../../../shared/api'
import { createHttpIntegrationGateway } from './http-integration-gateway'

describe('createHttpIntegrationGateway', () => {
  it('requests the list endpoint and maps its array response', async () => {
    const get = vi.fn().mockResolvedValue([{ id: 1, name: '1С', config_name: 'Бухгалтерия', connected_at: '2026-10-15T09:30:00.000000Z', is_active: true, status: 'active' }])
    const gateway = createHttpIntegrationGateway({ get } as unknown as ApiClient)
    const signal = new AbortController().signal

    await expect(gateway.list({ signal })).resolves.toEqual([{
      id: 1,
      name: '1С',
      configName: 'Бухгалтерия',
      connectedAt: '2026-10-15T09:30:00.000000Z',
      isActive: true,
      status: 'active',
    }])
    expect(get).toHaveBeenCalledWith('/cabinet/integrations', { signal })
  })

  it('requests a live check with the provided signal', async () => {
    const get = vi.fn().mockResolvedValue({ id: 7, status: 'online', checked_at: '2026-11-05T12:00:00Z' })
    const gateway = createHttpIntegrationGateway({ get } as unknown as ApiClient)
    const signal = new AbortController().signal

    await expect(gateway.check(7, { signal })).resolves.toEqual({
      id: 7,
      status: 'online',
      checkedAt: '2026-11-05T12:00:00Z',
    })
    expect(get).toHaveBeenCalledWith('/cabinet/integrations/7/check', { signal })
  })

  it('passes ApiError through unchanged', async () => {
    const error = new ApiError('Offline', { kind: 'http', status: 502 })
    const gateway = createHttpIntegrationGateway({ get: vi.fn().mockRejectedValue(error) } as unknown as ApiClient)

    await expect(gateway.list()).rejects.toBe(error)
  })
})
