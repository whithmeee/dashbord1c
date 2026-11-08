import { describe, expect, it } from 'vitest'
import { buildFinancialSalesView, periodToRange } from './financial-dashboard-view'
import type { SalesReport } from '../domain/financial-sales'

const report: SalesReport = {
  integrationId: 7,
  period: { from: '2026-05-01', to: '2026-10-31' },
  money: {
    currency: 'RUB',
    currencyStatus: 'confirmed',
    amountScale: 2,
    unit: 'minor_units',
  },
  monthly: [
    { period: '2026-05', amountMinor: 1200 },
    { period: '2026-06', amountMinor: 1800 },
  ],
  totalAmountMinor: 3000,
  customers: [{ name: 'ООО Ромашка', amountMinor: 1800 }],
  customersTotalAmountMinor: 1800,
}

describe('financial dashboard view', () => {
  it('builds calendar ranges for the supported periods', () => {
    expect(periodToRange('quarter', new Date('2026-10-15T12:00:00Z'))).toEqual({
      from: '2026-08-01',
      to: '2026-10-31',
    })
    expect(periodToRange('half-year', new Date('2026-10-15T12:00:00Z'))).toEqual({
      from: '2026-05-01',
      to: '2026-10-31',
    })
  })

  it('blocks monetary presentation while currency is unknown', () => {
    expect(buildFinancialSalesView({ ...report, money: { ...report.money, currency: null } })).toEqual({
      kind: 'currency-unavailable',
      message: 'Валюта документов не подтверждена. Денежные показатели временно недоступны',
    })
  })

  it('blocks a currency that is present but not confirmed', () => {
    expect(buildFinancialSalesView({ ...report, money: { ...report.money, currencyStatus: 'estimated' } }).kind).toBe('currency-unavailable')
  })

  it('exposes monthly sales and customers, never as debtors', () => {
    const view = buildFinancialSalesView(report)
    expect(view.kind).toBe('ready')
    if (view.kind === 'ready') {
      expect(view.monthly).toEqual(report.monthly)
      expect(view.customers).toEqual(report.customers)
      expect('debtors' in view).toBe(false)
    }
  })
})
