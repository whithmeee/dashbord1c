import { api, type ApiClient, type RequestOptions } from '../../../../shared/api'
import { mapSalesReport } from '../../domain/financial-sales-mapper'
import type { SalesReport } from '../../domain/financial-sales'

export type SalesReportQuery = {
  integrationId: number
  months: 3 | 6
  currencyKey?: string
}

export interface SalesSource {
  get(query: SalesReportQuery, options?: RequestOptions): Promise<SalesReport>
}

export function createHttpSalesSource(client: ApiClient): SalesSource {
  return {
    async get(query, options = {}): Promise<SalesReport> {
      const params = new URLSearchParams({
        integration_id: String(query.integrationId),
        months: String(query.months),
      })
      if (query.currencyKey) params.set('currency_key', query.currencyKey)
      const response = await client.get<unknown>(`/cabinet/finance/sales?${params.toString()}`, options)
      return mapSalesReport(response)
    },
  }
}

export const salesSource = createHttpSalesSource(api)
