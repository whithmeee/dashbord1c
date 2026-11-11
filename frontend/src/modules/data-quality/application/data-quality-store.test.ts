import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api'
import { createDataQualityStore, type DataQualityGateway } from './data-quality-store'

const report = {
  summary: {
    integrationId: 3,
    checkedAt: '2026-11-12T10:00:00Z',
    totals: { critical: 0, warning: 0, info: 0, checkedObjects: 5, issues: 0 },
    capabilities: { taxDetails: true, innValidation: true, kppValidation: true, legalType: true, contracts: true },
  },
  issues: [],
}

describe('createDataQualityStore', () => {
  it('loads, refreshes and avoids duplicate requests', async () => {
    const load = vi.fn().mockResolvedValue(report)
    const store = createDataQualityStore({ load }, { expireSession: vi.fn() })

    const first = store.load(3)
    const duplicate = store.load(3)
    expect(duplicate).toBe(first)
    await first
    expect(store.getSnapshot()).toEqual({ status: 'success', report })

    await store.refresh()
    expect(load).toHaveBeenLastCalledWith(3, true, expect.anything())
  })

  it('expires the session after 401', async () => {
    const session = { expireSession: vi.fn() }
    const gateway: DataQualityGateway = { load: vi.fn().mockRejectedValue(new ApiError('Unauthorized', { kind: 'http', status: 401 })) }
    const store = createDataQualityStore(gateway, session)

    await store.load(3)

    expect(store.getSnapshot()).toEqual({ status: 'idle' })
    expect(session.expireSession).toHaveBeenCalledOnce()
  })

  it('does not restore stale data after reset', async () => {
    let resolve: (value: typeof report) => void = () => undefined
    const pending = new Promise<typeof report>((done) => { resolve = done })
    const store = createDataQualityStore({ load: vi.fn().mockReturnValue(pending) }, { expireSession: vi.fn() })

    const request = store.load(3)
    store.reset()
    resolve(report)
    await request

    expect(store.getSnapshot()).toEqual({ status: 'idle' })
  })
})
