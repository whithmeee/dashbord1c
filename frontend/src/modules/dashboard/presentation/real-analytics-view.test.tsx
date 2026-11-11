import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { SalesReport } from '../domain/financial-sales'
import { AnalyticsCatalog, AnalyticsOverview } from './financial-sales-page'

const report: SalesReport = {
  integrationId: 7,
  availablePeriod: { to: '2025-08-31' },
  period: { from: '2025-03-01', to: '2025-08-31' },
  financialStatus: 'available',
  financialStatusCode: null,
  money: { currencyKey: 'rub', currency: 'руб.', currencyStatus: 'separated_by_document_currency', amountScale: null, unit: 'odata_document_amount' },
  currencies: [{ key: 'rub', name: 'руб.', documentCount: 2 }],
  metrics: { salesDocuments: 2, customers: 2, organizations: 1 },
  monthly: [{ period: '2025-08', amount: 300.31, documentCount: 2 }],
  customers: [{ key: 'buyer', name: 'Альфа', amount: 300.31, documentCount: 2 }],
  organizations: [{ key: 'org', name: 'Организация', amount: 300.31, documentCount: 2 }],
  receipts: [{ period: '2025-08', amount: 75.25, documentCount: 1 }],
  payments: [{ period: '2025-08', amount: 25.05, documentCount: 1 }],
  totalAmount: 300.31,
}

describe('real analytics presentation', () => {
  it('renders the overview only from the real report contract', () => {
    const markup = renderToStaticMarkup(<AnalyticsOverview report={report} />)
    expect(markup).toContain('Проведено реализаций')
    expect(markup).toContain('Сумма документов в выбранной валюте')
    expect(markup).not.toContain('Демонстрационные данные')
    expect(markup).not.toContain('Долг топ-5')
  })

  it('renders only confirmed real reports in the all-reports view', () => {
    const markup = renderToStaticMarkup(<AnalyticsCatalog report={report} />)
    expect(markup).toContain('Поступления на расчётный счёт')
    expect(markup).toContain('Списания с расчётного счёта')
    expect(markup).toContain('Количество реализаций')
    expect(markup).not.toContain('Финансовый результат')
  })
})
