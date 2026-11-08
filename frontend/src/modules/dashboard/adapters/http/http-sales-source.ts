import { api, type ApiClient, type RequestOptions } from '../../../../shared/api'
import { mapSalesReport } from '../../domain/financial-sales-mapper'
import type { SalesReport } from '../../domain/financial-sales'

export type SalesReportQuery = {
  integrationId: number
  from: string
  to: string
}

export interface SalesSource {
  get(query: SalesReportQuery, options?: RequestOptions): Promise<SalesReport>
}

export function createHttpSalesSource(client: ApiClient): SalesSource {
  return {
    async get(query, options = {}): Promise<SalesReport> {
      const params = new URLSearchParams({
        integration_id: String(query.integrationId),
        from: query.from,
        to: query.to,
      })
      const response = await client.get<unknown>(`/cabinet/finance/sales?${params.toString()}`, options)
      return mapSalesReport(response)
    },
  }
}

export const salesSource = createHttpSalesSource(api)
