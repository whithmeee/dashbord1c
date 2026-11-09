import { authSessionStore } from '../auth/react/auth-runtime'
import { cabinetDetailsGateway } from './adapters/http/http-cabinet-details-gateway'
import { createCabinetDetailsStore } from './application/cabinet-details-store'

export const cabinetDetailsStore = createCabinetDetailsStore(cabinetDetailsGateway, authSessionStore)

export function resetCabinetDetails(): void { cabinetDetailsStore.reset() }
