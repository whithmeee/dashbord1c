import { api, type ApiClient } from '../../../shared/api'
import type { PeriodReportGateway } from '../../../shared/period-report/period-report-store'
import type { ReceivablesDetails, ReceivablesSummary } from '../domain/receivables'
import { mapReceivablesDetails, mapReceivablesSummary } from '../domain/receivables-mapper'

export type ReceivablesGateway = PeriodReportGateway<ReceivablesSummary, ReceivablesDetails>

export function createHttpReceivablesGateway(client: ApiClient): ReceivablesGateway {
  return {
    async summary(integrationId, month, refresh, options = {}) {
      const refreshQuery = refresh ? '&refresh=1' : ''
      const response = await client.get<unknown>(
        `/api/receivables?integration_id=${integrationId}&month=${encodeURIComponent(month)}${refreshQuery}`,
        options,
      )
      return mapReceivablesSummary(response)
    },
    async details(integrationId, month, check, options = {}) {
      const response = await client.get<unknown>(
        `/api/receivables/checks/${encodeURIComponent(check)}?integration_id=${integrationId}&month=${encodeURIComponent(month)}`,
        options,
      )
      return mapReceivablesDetails(response)
    },
  }
}

export const receivablesGateway = createHttpReceivablesGateway(api)
