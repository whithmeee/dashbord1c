import { authSessionStore } from '../auth/react/auth-runtime'
import { integrationGateway } from './adapters/http/http-integration-gateway'
import { createIntegrationsStore } from './application/integrations-store'

export const integrationsStore = createIntegrationsStore(integrationGateway, authSessionStore)

export function resetIntegrations(): void {
  integrationsStore.reset()
}
