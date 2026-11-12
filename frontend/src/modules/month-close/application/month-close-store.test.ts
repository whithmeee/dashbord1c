import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api'
import type { MonthCloseDetails, MonthCloseSummary } from '../domain/month-close'
import { createMonthCloseStore, type MonthCloseGateway } from './month-close-store'

const summary = { integrationId: 7, month: '2026-10', readiness: 80 } as MonthCloseSummary
const details = { check: 'unposted', total: 1, items: [] } as MonthCloseDetails

function gateway(overrides: Partial<MonthCloseGateway> = {}): MonthCloseGateway {
  return {
    summary: vi.fn().mockResolvedValue(summary),
    details: vi.fn().mockResolvedValue(details),
    ...overrides,
  }
}

describe('month close store', () => {
  it('loads a summary, refreshes it and opens check details', async () => {
    const source = gateway()
    const store = createMonthCloseStore(source, { expireSession: vi.fn() })

    await store.load(7, '2026-10')
    await store.scan()
    await store.openCheck('unposted')

    expect(source.summary).toHaveBeenNthCalledWith(1, 7, '2026-10', false, expect.any(Object))
    expect(source.summary).toHaveBeenNthCalledWith(2, 7, '2026-10', true, expect.any(Object))
    expect(store.getSnapshot()).toMatchObject({ status: 'success', summary, details: { status: 'success', value: details } })
  })

  it('expires a 401 session and ignores a stale response after reset', async () => {
    const session = { expireSession: vi.fn() }
    const unauthorized = gateway({ summary: vi.fn().mockRejectedValue(new ApiError('Unauthorized', { kind: 'http', status: 401 })) })
    const store = createMonthCloseStore(unauthorized, session)
    await store.load(7, '2026-10')
    expect(session.expireSession).toHaveBeenCalledOnce()
    expect(store.getSnapshot()).toEqual({ status: 'idle' })

    let finish: (value: MonthCloseSummary) => void = () => undefined
    const pending = new Promise<MonthCloseSummary>((resolve) => { finish = resolve })
    const stale = createMonthCloseStore(gateway({ summary: vi.fn().mockReturnValue(pending) }), session)
    const request = stale.load(7, '2026-10')
    stale.reset()
    finish(summary)
    await request
    expect(stale.getSnapshot()).toEqual({ status: 'idle' })
  })

  it('replaces an in-flight request when the selected period changes', async () => {
    let finish: (value: MonthCloseSummary) => void = () => undefined
    const pending = new Promise<MonthCloseSummary>((resolve) => { finish = resolve })
    const november = { ...summary, integrationId: 8, month: '2026-11' }
    const source = gateway({ summary: vi.fn().mockReturnValueOnce(pending).mockResolvedValueOnce(november) })
    const store = createMonthCloseStore(source, { expireSession: vi.fn() })

    const octoberRequest = store.load(7, '2026-10')
    const novemberRequest = store.load(8, '2026-11')
    finish(summary)
    await Promise.all([octoberRequest, novemberRequest])

    expect(source.summary).toHaveBeenCalledTimes(2)
    expect(store.getSnapshot()).toMatchObject({ status: 'success', summary: november })
  })
})
