import { describe, expect, it } from 'vitest'
import { receivablesDetailsResponse, receivablesSummaryResponse } from '../testing/receivables-fixture'
import { mapReceivablesDetails, mapReceivablesSummary } from './receivables-mapper'

describe('receivables mapper', () => {
  it('maps the summary into camel case domain values', () => {
    expect(mapReceivablesSummary(receivablesSummaryResponse)).toMatchObject({
      integrationId: 7,
      shipped: 2100000,
      paid: 1000000,
      outstanding: 1400000,
      debtorsTotal: 2,
      counterpartiesTotal: 4,
      checks: [{ key: 'unpaid', status: 'critical', count: 1 }, { key: 'partial' }, { key: 'overpaid', status: 'ok' }],
    })
  })

  it('maps debtor details with amounts', () => {
    expect(mapReceivablesDetails(receivablesDetailsResponse).items[0]).toMatchObject({
      counterparty: 'ООО Ромашка',
      shipped: 600000,
      paid: 200000,
      outstanding: 400000,
    })
  })

  it('rejects a summary with a non numeric amount', () => {
    expect(() => mapReceivablesSummary({ ...receivablesSummaryResponse, outstanding: 'many' })).toThrow('receivables.outstanding must be a number')
  })
})
