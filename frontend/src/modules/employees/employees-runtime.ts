import { authSessionStore } from '../auth/react/auth-runtime'
import { employeesGateway } from './adapters/http/http-employees-gateway'
import { createEmployeesStore } from './application/employees-store'

export const employeesStore = createEmployeesStore(employeesGateway, authSessionStore)

export function resetEmployees(): void {
  employeesStore.reset()
}
