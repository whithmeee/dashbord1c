import { api, type ApiClient, type RequestOptions } from '../../../../shared/api'
import { mapCabinetDashboard } from '../../domain/cabinet-dashboard-mapper'
import type { CabinetDashboard } from '../../domain/cabinet'

export interface CabinetGateway {
  getDashboard(options?: RequestOptions): Promise<CabinetDashboard>
}

export function createHttpCabinetGateway(client: ApiClient): CabinetGateway {
  return {
    async getDashboard(options): Promise<CabinetDashboard> {
      const response = await client.get<unknown>('/cabinet/dashboard', options)
      return mapCabinetDashboard(response)
    },
  }
}

export const cabinetGateway = createHttpCabinetGateway(api)
