import { authSessionStore } from '../auth/react/auth-runtime'
import { integrationsStore } from '../integrations/integrations-runtime'
import { salesSource } from './adapters/http/http-sales-source'
import { createFinancialSalesStore } from './application/financial-sales-store'

export const financialSalesStore = createFinancialSalesStore(
  salesSource,
  integrationsStore,
  authSessionStore,
)

export function resetFinancialSales(): void {
  financialSalesStore.reset()
}
