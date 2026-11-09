import { api, type ApiClient, type RequestOptions } from '../../../../shared/api'
import { mapCabinetStatistics, mapCabinetSubscription, mapCabinetSystemStatus } from '../../domain/cabinet-details-mapper'
import type { CabinetStatistics, CabinetStatisticsQuery, CabinetSubscription, CabinetSystemStatus } from '../../domain/cabinet-details'

export interface CabinetDetailsGateway {
  getSystemStatus(options?: RequestOptions): Promise<CabinetSystemStatus>
  getSubscription(options?: RequestOptions): Promise<CabinetSubscription>
  getStatistics(query?: CabinetStatisticsQuery, options?: RequestOptions): Promise<CabinetStatistics>
}

export function createHttpCabinetDetailsGateway(client: ApiClient): CabinetDetailsGateway {
  return {
    async getSystemStatus(options) {
      return mapCabinetSystemStatus(await client.get<unknown>('/cabinet/system-status', options))
    },
    async getSubscription(options) {
      return mapCabinetSubscription(await client.get<unknown>('/cabinet/subscription', options))
    },
    async getStatistics(query = { period: 'month' }, options) {
      const params = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => { if (value !== undefined) params.set(toSnakeCase(key), String(value)) })
      const suffix = params.toString() ? `?${params.toString()}` : ''
      return mapCabinetStatistics(await client.get<unknown>(`/cabinet/statistics${suffix}`, options))
    },
  }
}

function toSnakeCase(value: string): string { return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`) }

export const cabinetDetailsGateway = createHttpCabinetDetailsGateway(api)
