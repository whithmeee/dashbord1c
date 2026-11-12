import { api, type ApiClient, type RequestOptions } from '../../../shared/api'
import type { MonthCloseDetails, MonthCloseSummary } from '../domain/month-close'
import { mapMonthCloseDetails, mapMonthCloseSummary } from '../domain/month-close-mapper'

export interface MonthCloseGateway {
  summary(integrationId: number, month: string, refresh: boolean, options?: RequestOptions): Promise<MonthCloseSummary>
  details(integrationId: number, month: string, check: string, options?: RequestOptions): Promise<MonthCloseDetails>
}

export function createHttpMonthCloseGateway(client: ApiClient): MonthCloseGateway {
  return {
    async summary(integrationId, month, refresh, options = {}) {
      const refreshQuery = refresh ? '&refresh=1' : ''
      const response = await client.get<unknown>(
        `/api/month-close?integration_id=${integrationId}&month=${encodeURIComponent(month)}${refreshQuery}`,
        options,
      )
      return mapMonthCloseSummary(response)
    },
    async details(integrationId, month, check, options = {}) {
      const response = await client.get<unknown>(
        `/api/month-close/checks/${encodeURIComponent(check)}?integration_id=${integrationId}&month=${encodeURIComponent(month)}`,
        options,
      )
      return mapMonthCloseDetails(response)
    },
  }
}

export const monthCloseGateway = createHttpMonthCloseGateway(api)
