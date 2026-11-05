import { api, type ApiClient, type RequestOptions } from '../../../../shared/api'
import { mapIntegrationCheck, mapIntegrations } from '../../domain/integration-mapper'
import type { Integration, IntegrationCheck } from '../../domain/integration'

export interface IntegrationGateway {
  list(options?: RequestOptions): Promise<readonly Integration[]>
  check(id: number, options?: RequestOptions): Promise<IntegrationCheck>
}

export function createHttpIntegrationGateway(client: ApiClient): IntegrationGateway {
  return {
    async list(options): Promise<readonly Integration[]> {
      const response = await client.get<unknown>('/cabinet/integrations', options)
      return mapIntegrations(response)
    },

    async check(id, options): Promise<IntegrationCheck> {
      const response = await client.get<unknown>(`/cabinet/integrations/${id}/check`, options)
      return mapIntegrationCheck(response)
    },
  }
}

export const integrationGateway = createHttpIntegrationGateway(api)
