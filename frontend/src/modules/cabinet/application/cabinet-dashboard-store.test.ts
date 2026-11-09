import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api'
import type { CabinetGateway } from '../adapters/http/http-cabinet-gateway'
import type { CabinetDashboard } from '../domain/cabinet'
import {
  createCabinetDashboardStore,
} from './cabinet-dashboard-store'

const dashboard: CabinetDashboard = {
  company: {
    id: 1,
    name: 'Осминог',
    email: 'owner@example.com',
    emailVerified: true,
    subscriptionStatus: 'inactive',
    phones: [],
    messengers: [],
    createdAt: '2026-11-05T00:00:00Z',
  },
  viewer: { type: 'company', name: 'Осминог', position: null },
  integrations: { count: 0, activeCount: 0, items: [] },
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function createSessionDependency() {
  return { expireSession: vi.fn() }
}

describe('CabinetDashboardStore', () => {
  it('transitions idle to loading to success', async () => {
    const gateway = { getDashboard: vi.fn().mockResolvedValue(dashboard) } as unknown as CabinetGateway
    const store = createCabinetDashboardStore(gateway, createSessionDependency())

    expect(store.getSnapshot()).toEqual({ status: 'idle' })
    const request = store.load()
    expect(store.getSnapshot()).toEqual({ status: 'loading' })
    await request

    expect(store.getSnapshot()).toEqual({ status: 'success', data: dashboard })
  })

  it('keeps network and server failures retryable', async () => {
    const gateway = { getDashboard: vi.fn().mockRejectedValue(new ApiError('Down', { kind: 'network' })) } as unknown as CabinetGateway
    const store = createCabinetDashboardStore(gateway, createSessionDependency())

    await expect(store.load()).resolves.toBeUndefined()
    expect(store.getSnapshot().status).toBe('error')
    await store.retry()
    expect(gateway.getDashboard).toHaveBeenCalledTimes(2)
  })

  it('expires the session and clears data on 401', async () => {
    const session = createSessionDependency()
    const gateway = { getDashboard: vi.fn().mockRejectedValue(new ApiError('Unauthenticated', { kind: 'http', status: 401 })) } as unknown as CabinetGateway
    const store = createCabinetDashboardStore(gateway, session)

    await store.load()

    expect(store.getSnapshot()).toMatchObject({ status: 'error', sessionExpired: true })
    expect(session.expireSession).toHaveBeenCalledOnce()
  })

  it('does not logout on 403 and treats empty collections as valid', async () => {
    const session = createSessionDependency()
    const gateway = { getDashboard: vi.fn().mockResolvedValue(dashboard) } as unknown as CabinetGateway
    const store = createCabinetDashboardStore(gateway, session)

    await store.load()
    expect(store.getSnapshot()).toEqual({ status: 'success', data: dashboard })
    expect(session.expireSession).not.toHaveBeenCalled()

    gateway.getDashboard = vi.fn().mockRejectedValue(new ApiError('Forbidden', { kind: 'http', status: 403 }))
    await store.retry()
    expect(store.getSnapshot().status).toBe('error')
    expect(session.expireSession).not.toHaveBeenCalled()
  })

  it('ignores a stale response after reset and a newer load', async () => {
    const first = deferred<CabinetDashboard>()
    const second = deferred<CabinetDashboard>()
    const gateway = { getDashboard: vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise) } as unknown as CabinetGateway
    const store = createCabinetDashboardStore(gateway, createSessionDependency())

    const firstLoad = store.load()
    store.reset()
    const secondLoad = store.load()
    second.resolve(dashboard)
    await secondLoad
    first.resolve({ ...dashboard, company: { ...dashboard.company, name: 'Старые данные' } })
    await firstLoad

    expect(store.getSnapshot()).toEqual({ status: 'success', data: dashboard })
  })

  it('notifies subscribers and reset cancels the active request', async () => {
    const request = deferred<CabinetDashboard>()
    const abort = vi.fn()
    const gateway = { getDashboard: vi.fn(({ signal }: { signal?: AbortSignal }) => {
      signal?.addEventListener('abort', abort)
      return request.promise
    }) } as unknown as CabinetGateway
    const store = createCabinetDashboardStore(gateway, createSessionDependency())
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    void store.load()
    store.reset()
    unsubscribe()
    request.resolve(dashboard)

    expect(abort).toHaveBeenCalledOnce()
    expect(store.getSnapshot()).toEqual({ status: 'idle' })
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
