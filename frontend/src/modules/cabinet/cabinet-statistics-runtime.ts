import { authSessionStore } from '../auth/react/auth-runtime'
import { cabinetDetailsGateway } from './adapters/http/http-cabinet-details-gateway'
import { createCabinetStatisticsStore } from './application/cabinet-statistics-store'

export const cabinetStatisticsStore = createCabinetStatisticsStore(cabinetDetailsGateway, authSessionStore)

export function resetCabinetStatistics(): void {
  cabinetStatisticsStore.reset()
}
