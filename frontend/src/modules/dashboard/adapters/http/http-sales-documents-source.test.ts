import { describe, expect, it, vi } from 'vitest'
import type { ApiClient } from '../../../../shared/api'
import { createHttpSalesDocumentsSource } from './http-sales-documents-source'

describe('sales documents HTTP source', () => {
  it('maps a paginated drill-down and passes exact filters', async () => {
    const get = vi.fn().mockResolvedValue({
      items: [{
        id: 'sale-1', date: '2025-08-10T10:00:00', amount: '100.10', currency_key: 'rub',
        customer: { key: 'buyer-1', name: 'Альфа' }, organization: { key: 'org-1', name: 'Основная' },
      }],
      pagination: { page: 1, per_page: 20, total: 1, last_page: 1 },
    })
    const source = createHttpSalesDocumentsSource({ get } as unknown as ApiClient)

    await expect(source.get({
      integrationId: 7, from: '2025-08-01', to: '2025-08-31', currencyKey: 'rub', customerKey: 'buyer-1', page: 1,
    })).resolves.toMatchObject({ items: [{ id: 'sale-1', amount: 100.1 }], pagination: { total: 1 } })
    expect(get).toHaveBeenCalledWith(
      '/cabinet/finance/sales/documents?integration_id=7&from=2025-08-01&to=2025-08-31&currency_key=rub&customer_key=buyer-1&page=1&per_page=20',
      {},
    )
  })
})
