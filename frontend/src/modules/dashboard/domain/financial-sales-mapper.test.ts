import { describe, expect, it } from 'vitest'
import { InvalidSalesReportError, mapSalesReport } from './financial-sales-mapper'

const payload = {
  integration_id: 7,
  available_period: { to: '2025-08-31' },
  period: { from: '2025-03-01', to: '2025-08-31' },
  financial_status: 'available',
  financial_status_code: null,
  money: {
    currency_key: 'rub',
    currency: 'руб.',
    currency_status: 'separated_by_document_currency',
    amount_scale: null,
    unit: 'odata_document_amount',
  },
  currencies: [
    { key: 'rub', name: 'руб.', document_count: 2 },
    { key: 'eur', name: 'EUR', document_count: 1 },
  ],
  metrics: { sales_documents: 2, customers: 2, organizations: 1 },
  monthly: [{ period: '2025-03', amount: '100.10', document_count: 1 }],
  customers: [{ key: 'buyer', name: 'Альфа', amount: '100.10', document_count: 1 }],
  organizations: [{ key: 'org', name: 'Организация', amount: '100.10', document_count: 1 }],
  receipts: [{ period: '2025-03', amount: '75.25', document_count: 1 }],
  payments: [{ period: '2025-03', amount: '25.05', document_count: 1 }],
  total_amount: '100.10',
}

describe('financial sales mapper', () => {
  it('maps real currency-separated 1C analytics without relabelling cash flow as expenses', () => {
    expect(mapSalesReport(payload)).toEqual({
      integrationId: 7,
      availablePeriod: { to: '2025-08-31' },
      period: { from: '2025-03-01', to: '2025-08-31' },
      financialStatus: 'available',
      financialStatusCode: null,
      money: {
        currencyKey: 'rub',
        currency: 'руб.',
        currencyStatus: 'separated_by_document_currency',
        amountScale: null,
        unit: 'odata_document_amount',
      },
      currencies: [
        { key: 'rub', name: 'руб.', documentCount: 2 },
        { key: 'eur', name: 'EUR', documentCount: 1 },
      ],
      metrics: { salesDocuments: 2, customers: 2, organizations: 1 },
      monthly: [{ period: '2025-03', amount: 100.1, documentCount: 1 }],
      customers: [{ key: 'buyer', name: 'Альфа', amount: 100.1, documentCount: 1 }],
      organizations: [{ key: 'org', name: 'Организация', amount: 100.1, documentCount: 1 }],
      receipts: [{ period: '2025-03', amount: 75.25, documentCount: 1 }],
      payments: [{ period: '2025-03', amount: 25.05, documentCount: 1 }],
      totalAmount: 100.1,
    })
  })

  it('rejects malformed decimal values and missing currency separation metadata', () => {
    expect(() => mapSalesReport({ ...payload, total_amount: '100 RUB' }))
      .toThrow(InvalidSalesReportError)
    expect(() => mapSalesReport({ ...payload, money: { ...payload.money, currency_key: 1 } }))
      .toThrow(InvalidSalesReportError)
  })
})
