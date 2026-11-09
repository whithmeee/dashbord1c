import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api'
import type { IntegrationGateway } from '../adapters/http/http-integration-gateway'
import type { Integration, IntegrationCheck } from '../domain/integration'
import { createIntegrationsStore } from './integrations-store'

const items: readonly Integration[] = [
  { id: 1, name: 'Основная', configName: 'Бухгалтерия', connectedAt: null, isActive: true, status: 'active' },
  { id: 2, name: 'Филиал', configName: 'Бухгалтерия', connectedAt: null, isActive: true, status: 'active' },
]

function check(id: number, status: IntegrationCheck['status'] = 'online'): IntegrationCheck {
  return { id, status, checkedAt: `2026-11-05T12:0${id}:00Z` }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function fakeGateway(overrides: Partial<IntegrationGateway> = {}) {
  return {
    list: vi.fn().mockResolvedValue(items),
    check: vi.fn().mockResolvedValue(check(1)),
    ...overrides,
  } satisfies IntegrationGateway
}

describe('createIntegrationsStore', () => {
  it('loads integrations from idle to success, including an empty list', async () => {
    const gateway = fakeGateway({ list: vi.fn().mockResolvedValue([]) })
    const store = createIntegrationsStore(gateway, { expireSession: vi.fn() })

    expect(store.getSnapshot()).toEqual({ status: 'idle' })
    const request = store.load()
    expect(store.getSnapshot()).toEqual({ status: 'loading' })
    await request

    expect(store.getSnapshot()).toEqual({ status: 'success', items: [], checks: {} })
  })

  it('retries a failed load successfully', async () => {
    const gateway = fakeGateway({
      list: vi.fn().mockRejectedValueOnce(new Error('temporary')).mockResolvedValueOnce(items),
    })
    const store = createIntegrationsStore(gateway, { expireSession: vi.fn() })

    await store.load()
    expect(store.getSnapshot().status).toBe('error')
    await store.retry()

    expect(store.getSnapshot()).toMatchObject({ status: 'success', items })
  })

  it('stores independent online, offline and inactive checks', async () => {
    const gateway = fakeGateway({ check: vi.fn((id: number) => Promise.resolve(check(id, id === 1 ? 'online' : id === 2 ? 'offline' : 'inactive'))) })
    const store = createIntegrationsStore(gateway, { expireSession: vi.fn() })
    await store.load()

    await Promise.all([store.check(1), store.check(2), store.check(3)])

    expect(store.getSnapshot()).toMatchObject({
      status: 'success',
      checks: {
        1: { status: 'online', checkedAt: '2026-11-05T12:01:00Z' },
        2: { status: 'offline', checkedAt: '2026-11-05T12:02:00Z' },
      },
    })
  })

  it('deduplicates repeated checks for one integration', async () => {
    const pending = deferred<IntegrationCheck>()
    const gateway = fakeGateway({ check: vi.fn().mockReturnValue(pending.promise) })
    const store = createIntegrationsStore(gateway, { expireSession: vi.fn() })
    await store.load()

    const first = store.check(1)
    const second = store.check(1)
    expect(gateway.check).toHaveBeenCalledTimes(1)
    pending.resolve(check(1))
    await Promise.all([first, second])
  })

  it('keeps checks for different integrations independent', async () => {
    const first = deferred<IntegrationCheck>()
    const second = deferred<IntegrationCheck>()
    const gateway = fakeGateway({ check: vi.fn().mockImplementation((id: number) => id === 1 ? first.promise : second.promise) })
    const store = createIntegrationsStore(gateway, { expireSession: vi.fn() })
    await store.load()

    const firstRequest = store.check(1)
    const secondRequest = store.check(2)
    first.resolve(check(1))
    await firstRequest
    expect(store.getSnapshot()).toMatchObject({ checks: { 1: { status: 'online' }, 2: { status: 'checking' } } })
    second.resolve(check(2))
    await secondRequest
  })

  it.each([403, 404, 429])('keeps HTTP %s as a per-integration error without logout', async (status) => {
    const gateway = fakeGateway({ check: vi.fn().mockRejectedValue(new ApiError('Request failed', { kind: 'http', status })) })
    const expireSession = vi.fn()
    const store = createIntegrationsStore(gateway, { expireSession })
    await store.load()
    await store.check(1)

    expect(store.getSnapshot()).toMatchObject({ checks: { 1: { status: 'error', error: expect.any(Error) } } })
    expect(expireSession).not.toHaveBeenCalled()
  })

  it('expires the session and clears data on 401', async () => {
    const expireSession = vi.fn()
    const gateway = fakeGateway({ list: vi.fn().mockRejectedValue(new ApiError('Unauthorised', { kind: 'http', status: 401 })) })
    const store = createIntegrationsStore(gateway, { expireSession })
    await store.load()

    expect(store.getSnapshot()).toEqual({ status: 'idle' })
    expect(expireSession).toHaveBeenCalledOnce()
  })

  it('resets and aborts active requests so stale responses cannot restore data', async () => {
    const pending = deferred<readonly Integration[]>()
    const gateway = fakeGateway({ list: vi.fn().mockReturnValue(pending.promise) })
    const store = createIntegrationsStore(gateway, { expireSession: vi.fn() })
    const request = store.load()
    store.reset()
    pending.resolve(items)
    await request

    expect(store.getSnapshot()).toEqual({ status: 'idle' })
  })

  it('does not restore a check for an integration removed by a reload', async () => {
    const checks = deferred<IntegrationCheck>()
    const gateway = fakeGateway({
      list: vi.fn().mockResolvedValueOnce(items).mockResolvedValueOnce([items[1]]),
      check: vi.fn().mockReturnValue(checks.promise),
    })
    const store = createIntegrationsStore(gateway, { expireSession: vi.fn() })
    await store.load()
    const checkRequest = store.check(1)
    await store.load()
    checks.resolve(check(1))
    await checkRequest

    expect(store.getSnapshot()).toMatchObject({ status: 'success', items: [items[1]], checks: {} })
  })
})
