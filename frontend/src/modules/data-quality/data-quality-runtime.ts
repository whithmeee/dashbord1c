import { authSessionStore } from '../auth/react/auth-runtime'
import { dataQualityGateway } from './adapters/http-data-quality-gateway'
import { createDataQualityStore } from './application/data-quality-store'

export const dataQualityStore = createDataQualityStore(dataQualityGateway, authSessionStore)

export function resetDataQuality(): void {
  dataQualityStore.reset()
}
