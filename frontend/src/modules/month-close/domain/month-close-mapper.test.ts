import { describe, expect, it } from 'vitest'
import { monthCloseDetailsResponse, monthCloseSummaryResponse } from '../testing/month-close-fixture'
import { mapMonthCloseDetails, mapMonthCloseSummary } from './month-close-mapper'

describe('month close mapper', () => {
  it('maps readiness checks and document details', () => {
    expect(mapMonthCloseSummary(monthCloseSummaryResponse)).toEqual({
      integrationId: 7,
      month: '2026-10',
      generatedAt: '2026-11-12T14:00:00+00:00',
      documentsTotal: 40,
      documentsFlagged: 8,
      readiness: 80,
      checks: [
        { key: 'unposted', label: 'Не проведены', count: 3, status: 'critical' },
        { key: 'no_counterparty', label: 'Не указан контрагент', count: 2, status: 'warning' },
        { key: 'zero_amount', label: 'Нулевая сумма', count: 0, status: 'ok' },
        { key: 'anomalous_amount', label: 'Аномальная сумма', count: 3, status: 'warning' },
      ],
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
