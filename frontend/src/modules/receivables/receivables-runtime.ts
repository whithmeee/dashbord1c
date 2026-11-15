import { authSessionStore } from '../auth/react/auth-runtime'
import { receivablesGateway } from './adapters/http-receivables-gateway'
import { createReceivablesStore } from './application/receivables-store'

export const receivablesStore = createReceivablesStore(receivablesGateway, authSessionStore)
export const resetReceivables = () => receivablesStore.reset()
