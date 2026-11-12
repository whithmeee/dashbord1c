import { authSessionStore } from '../auth/react/auth-runtime'
import { monthCloseGateway } from './adapters/http-month-close-gateway'
import { createMonthCloseStore } from './application/month-close-store'

export const monthCloseStore = createMonthCloseStore(monthCloseGateway, authSessionStore)
export const resetMonthClose = () => monthCloseStore.reset()
