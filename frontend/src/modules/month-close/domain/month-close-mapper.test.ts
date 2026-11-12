import { describe, expect, it } from 'vitest'
import { monthCloseDetailsResponse, monthCloseSummaryResponse } from '../testing/month-close-fixture'
import { mapMonthCloseDetails, mapMonthCloseSummary } from './month-close-mapper'

describe('month close mapper', () => {
  it('maps readiness checks and document details', () => {
    expect(mapMonthCloseSummary(monthCloseSummaryResponse)).toMatchObject({
      integrationId: 7,
      month: '2026-10',
      documentsTotal: 40,
      documentsFlagged: 8,
      readiness: 80,
      checks: [{ key: 'unposted', count: 3, status: 'critical' }],
    })
    expect(mapMonthCloseDetails(monthCloseDetailsResponse)).toMatchObject({
      check: 'unposted',
      total: 1,
      items: [{ refKey: 'document-1', entityLabel: 'Поступление товаров и услуг', amount: 45630 }],
    })
  })

  it('rejects invalid required fields', () => {
    expect(() => mapMonthCloseSummary({ ...monthCloseSummaryResponse, readiness: '80' })).toThrow('monthClose.readiness')
  })
})
