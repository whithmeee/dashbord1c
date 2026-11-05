import { authSessionStore } from '../auth/react/auth-runtime'
import { cabinetGateway } from './adapters/http/http-cabinet-gateway'
import { createCabinetDashboardStore } from './application/cabinet-dashboard-store'

export const cabinetDashboardStore = createCabinetDashboardStore(
  cabinetGateway,
  authSessionStore,
)

export function resetCabinetDashboard(): void {
  cabinetDashboardStore.reset()
}
