import { describe, expect, it } from 'vitest'
import { InvalidSalesReportError, mapSalesReport } from './financial-sales-mapper'

const payload = {
  integration_id: 7,
  period: { from: '2026-10-01', to: '2026-11-30' },
  financial_status: 'available',
  financial_status_code: null,
  money: {
    currency: null,
    currency_status: 'not_provided_by_current_odata',
    amount_scale: 2,
    unit: 'minor_units',
  },
  monthly: [{ period: '2026-10', amount_minor: 35035 }],
  total_amount_minor: 35035,
  customers: [{ name: 'Альфа', amount_minor: 35035 }],
  customers_total_amount_minor: 35035,
}

describe('financial sales mapper', () => {
  it('maps the complete Laravel sales contract without calculations', () => {
    expect(mapSalesReport(payload)).toEqual({
      integrationId: 7,
      period: { from: '2026-10-01', to: '2026-11-30' },
      financialStatus: 'available',
      financialStatusCode: null,
      money: {
        currency: null,
        currencyStatus: 'not_provided_by_current_odata',
        amountScale: 2,
        unit: 'minor_units',
      },
      monthly: [{ period: '2026-10', amountMinor: 35035 }],
      totalAmountMinor: 35035,
      customers: [{ name: 'Альфа', amountMinor: 35035 }],
      customersTotalAmountMinor: 35035,
    })
  })

  it('maps unavailable financial data without turning null into zero', () => {
    expect(mapSalesReport({
      ...payload,
      financial_status: 'unavailable',
      financial_status_code: 'currency_unconfirmed',
      money: { currency: null, currency_status: 'not_provided_by_current_odata', amount_scale: null, unit: null },
      monthly: [],
      customers: [],
      total_amount_minor: null,
      customers_total_amount_minor: null,
    })).toMatchObject({
      financialStatus: 'unavailable',
      financialStatusCode: 'currency_unconfirmed',
      money: { currency: null, amountScale: null, unit: null },
      monthly: [],
      customers: [],
      totalAmountMinor: null,
      customersTotalAmountMinor: null,
    })
  })

  it('rejects missing fields and unsafe financial integers', () => {
    expect(() => mapSalesReport({ ...payload, total_amount_minor: Number.MAX_SAFE_INTEGER + 1 }))
      .toThrow(InvalidSalesReportError)
    expect(() => mapSalesReport({ ...payload, money: { ...payload.money, currency_status: 1 } }))
      .toThrow(InvalidSalesReportError)
  })
})
