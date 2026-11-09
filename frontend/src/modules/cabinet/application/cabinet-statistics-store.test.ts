import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api'
import type { CabinetStatistics } from '../domain/cabinet-details'
import { createCabinetStatisticsStore } from './cabinet-statistics-store'

const statistics: CabinetStatistics = {
  period: { from: '2026-10-01', to: '2026-10-31', group: 'day' },
  total: 4,
  summary: { averagePerDay: 0.1, activeDays: 2, peakDay: null, lastRequestAt: null },
  byPeriod: [],
  byIntegration: [],
  byAuthor: [],
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })

  return { promise, resolve, reject }
}

describe('cabinet statistics store', () => {
  it('loads statistics for a month', async () => {
    const getStatistics = vi.fn().mockResolvedValue(statistics)
    const store = createCabinetStatisticsStore({ getStatistics }, { expireSession: vi.fn() })

    await store.load('2026-10')

    expect(getStatistics).toHaveBeenCalledWith({ month: '2026-10' }, expect.objectContaining({ signal: expect.any(AbortSignal) }))
    expect(store.getSnapshot()).toEqual({ status: 'success', month: '2026-10', statistics })
  })

  it('shows the requested month while loading', () => {
    const pending = deferred<CabinetStatistics>()
    const store = createCabinetStatisticsStore({ getStatistics: () => pending.promise }, { expireSession: vi.fn() })

    void store.load('2026-09')

    expect(store.getSnapshot()).toEqual({ status: 'loading', month: '2026-09' })
  })

  it('ignores a stale response when another month was requested', async () => {
    const first = deferred<CabinetStatistics>()
    const second = deferred<CabinetStatistics>()
    const getStatistics = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const store = createCabinetStatisticsStore({ getStatistics }, { expireSession: vi.fn() })

    const firstLoad = store.load('2026-09')
    const secondLoad = store.load('2026-10')
    second.resolve({ ...statistics, total: 7 })
    first.resolve({ ...statistics, total: 1 })
    await Promise.all([firstLoad, secondLoad])

    expect(store.getSnapshot()).toMatchObject({ status: 'success', month: '2026-10', statistics: { total: 7 } })
  })

  it('publishes an error and retries the same month', async () => {
    const getStatistics = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(statistics)
    const store = createCabinetStatisticsStore({ getStatistics }, { expireSession: vi.fn() })

    await store.load('2026-10')
    expect(store.getSnapshot()).toMatchObject({ status: 'error', month: '2026-10' })

    await store.retry()
    expect(getStatistics).toHaveBeenLastCalledWith({ month: '2026-10' }, expect.anything())
    expect(store.getSnapshot()).toMatchObject({ status: 'success' })
  })

  it('expires the session on 401 instead of showing an error', async () => {
    const expireSession = vi.fn()
    const unauthorized = new ApiError('Требуется вход в систему.', { kind: 'http', status: 401 })
    const store = createCabinetStatisticsStore({ getStatistics: vi.fn().mockRejectedValue(unauthorized) }, { expireSession })

    await store.load('2026-10')

    expect(expireSession).toHaveBeenCalledOnce()
    expect(store.getSnapshot()).toEqual({ status: 'loading', month: '2026-10' })
  })

  it('returns to idle on reset and ignores late responses', async () => {
    const pending = deferred<CabinetStatistics>()
    const store = createCabinetStatisticsStore({ getStatistics: () => pending.promise }, { expireSession: vi.fn() })
    const loading = store.load('2026-10')

    store.reset()
    pending.resolve(statistics)
    await loading

    expect(store.getSnapshot()).toEqual({ status: 'idle' })
  })

  it('notifies subscribers until they unsubscribe', async () => {
    const store = createCabinetStatisticsStore({ getStatistics: vi.fn().mockResolvedValue(statistics) }, { expireSession: vi.fn() })
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    await store.load('2026-10')
    const calls = listener.mock.calls.length
    unsubscribe()
    await store.load('2026-09')

    expect(calls).toBeGreaterThan(0)
    expect(listener).toHaveBeenCalledTimes(calls)
  })
})
