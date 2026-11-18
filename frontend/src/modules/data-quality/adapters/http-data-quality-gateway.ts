import { api, type ApiClient, type RequestOptions } from '../../../shared/api'
import { mapDataQualityIssues, mapDataQualitySummary } from '../domain/data-quality-mapper'
import type { DataQualityReport } from '../domain/data-quality'
import type { CounterpartyChange } from '../domain/data-quality-resolution'

export interface DataQualityGateway {
  load(integrationId: number, refresh: boolean, options?: RequestOptions): Promise<DataQualityReport>
  fixCounterparty(integrationId: number, objectId: string, change: CounterpartyChange, options?: RequestOptions): Promise<void>
}

export function createHttpDataQualityGateway(client: ApiClient): DataQualityGateway {
  return {
    async load(integrationId, refresh, options): Promise<DataQualityReport> {
      const refreshQuery = refresh ? '&refresh=1' : ''
      const summaryResponse = await client.get<unknown>(
        `/cabinet/data-quality/summary?integration_id=${integrationId}${refreshQuery}`,
        options,
      )
      const issuesResponse = await client.get<unknown>(
        `/cabinet/data-quality/issues?integration_id=${integrationId}`,
        options,
      )

      return {
        summary: mapDataQualitySummary(summaryResponse),
        issues: mapDataQualityIssues(issuesResponse).items,
      }
    },
    async fixCounterparty(integrationId, objectId, change, options) {
      await client.patch(`/cabinet/data-quality/counterparties/${objectId}`, toRequest(integrationId, change), options)
    },
  }
}

function toRequest(integrationId: number, change: CounterpartyChange): Record<string, unknown> {
  return { integration_id: integrationId, inn: change.inn, kpp: change.kpp, legal_type: change.legalType }
}

export const dataQualityGateway = createHttpDataQualityGateway(api)
