import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api'
import type { DataQualityIssue } from '../domain/data-quality'
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

const issue = (rule: string, severity: DataQualityIssue['severity']): DataQualityIssue => ({
  id: `${rule}:c1`,
  rule,
  severity,
  category: 'tax_details',
  entity: 'Catalog_Контрагенты',
  objectId: 'c1',
  title: 'Альфа',
  message: 'Проблема',
  fields: {},
})

const reportWithIssues = {
  summary: { ...report.summary, totals: { ...report.summary.totals, critical: 1, warning: 1, issues: 2 } },
  issues: [issue('missing_inn', 'critical'), issue('missing_kpp', 'warning')],
}

function gateway(overrides: Partial<DataQualityGateway> = {}): DataQualityGateway {
  return { load: vi.fn().mockResolvedValue(report), fixCounterparty: vi.fn().mockResolvedValue(undefined), ...overrides }
}

describe('createDataQualityStore', () => {
  it('loads, refreshes and avoids duplicate requests', async () => {
    const source = gateway()
    const store = createDataQualityStore(source, { expireSession: vi.fn() })

    const first = store.load(3)
    const duplicate = store.load(3)
    expect(duplicate).toBe(first)
    await first
    expect(store.getSnapshot()).toEqual({ status: 'success', report })

    await store.refresh()
    expect(source.load).toHaveBeenLastCalledWith(3, true, expect.anything())
  })

  it('expires the session after 401', async () => {
    const session = { expireSession: vi.fn() }
    const store = createDataQualityStore(gateway({ load: vi.fn().mockRejectedValue(new ApiError('Unauthorized', { kind: 'http', status: 401 })) }), session)

    await store.load(3)

    expect(store.getSnapshot()).toEqual({ status: 'idle' })
    expect(session.expireSession).toHaveBeenCalledOnce()
  })

  it('does not restore stale data after reset', async () => {
    let resolve: (value: typeof report) => void = () => undefined
    const pending = new Promise<typeof report>((done) => { resolve = done })
    const store = createDataQualityStore(gateway({ load: vi.fn().mockReturnValue(pending) }), { expireSession: vi.fn() })

    const request = store.load(3)
    store.reset()
    resolve(report)
    await request

    expect(store.getSnapshot()).toEqual({ status: 'idle' })
  })

  it('drops the resolved issues of the counterparty and recounts the totals after a fix', async () => {
    const source = gateway({ load: vi.fn().mockResolvedValue(reportWithIssues) })
    const store = createDataQualityStore(source, { expireSession: vi.fn() })
    await store.load(3)

    await store.fixCounterparty('c1', { inn: '7707083893' })

    expect(source.fixCounterparty).toHaveBeenCalledWith(3, 'c1', { inn: '7707083893' })
    expect(store.getSnapshot()).toMatchObject({
      status: 'success',
      report: { summary: { totals: { critical: 0, warning: 1, issues: 1 } }, issues: [{ rule: 'missing_kpp' }] },
    })
  })

  it('keeps the report and rethrows when 1C refuses the fix', async () => {
    const failure = new ApiError('Refused', { kind: 'http', status: 422 })
    const store = createDataQualityStore(gateway({ load: vi.fn().mockResolvedValue(reportWithIssues), fixCounterparty: vi.fn().mockRejectedValue(failure) }), { expireSession: vi.fn() })
    await store.load(3)

    await expect(store.fixCounterparty('c1', { inn: '7707083893' })).rejects.toBe(failure)
    expect(store.getSnapshot()).toEqual({ status: 'success', report: reportWithIssues })
  })

  it('expires the session when the fix is unauthorized', async () => {
    const session = { expireSession: vi.fn() }
    const failure = new ApiError('Unauthorized', { kind: 'http', status: 401 })
    const store = createDataQualityStore(gateway({ load: vi.fn().mockResolvedValue(reportWithIssues), fixCounterparty: vi.fn().mockRejectedValue(failure) }), session)
    await store.load(3)

    await expect(store.fixCounterparty('c1', { kpp: '770701001' })).rejects.toBe(failure)
    expect(store.getSnapshot()).toEqual({ status: 'idle' })
    expect(session.expireSession).toHaveBeenCalledOnce()
  })
})
