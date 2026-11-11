import { api, type ApiClient, type RequestOptions } from '../../../shared/api'
import { mapDataQualityIssues, mapDataQualitySummary } from '../domain/data-quality-mapper'
import type { DataQualityReport } from '../domain/data-quality'

export interface DataQualityGateway {
  load(integrationId: number, refresh: boolean, options?: RequestOptions): Promise<DataQualityReport>
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
  }
}

export const dataQualityGateway = createHttpDataQualityGateway(api)
