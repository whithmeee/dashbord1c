import { authSessionStore } from '../auth/react/auth-runtime'
import { employeesGateway } from './adapters/http/http-employees-gateway'
import { createEmployeesStore } from './application/employees-store'
import { createEmployeeActivityStore } from './application/employee-activity-store'

export const employeesStore = createEmployeesStore(employeesGateway, authSessionStore)
export const employeeActivityStore = createEmployeeActivityStore(employeesGateway, authSessionStore)

export function resetEmployees(): void {
  employeesStore.reset()
  employeeActivityStore.reset()
}
