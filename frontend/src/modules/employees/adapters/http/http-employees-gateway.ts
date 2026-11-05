import { api, type ApiClient, type RequestOptions } from '../../../../shared/api'
import { mapEmployee, mapEmployees } from '../../domain/employee-mapper'
import type { CreateEmployeeInput, Employee, UpdateEmployeeInput } from '../../domain/employee'

export interface EmployeesGateway {
  list(options?: RequestOptions): Promise<readonly Employee[]>
  create(input: CreateEmployeeInput, options?: RequestOptions): Promise<Employee>
  update(id: number, input: UpdateEmployeeInput, options?: RequestOptions): Promise<Employee>
  remove(id: number, options?: RequestOptions): Promise<void>
}

export function createHttpEmployeesGateway(client: ApiClient): EmployeesGateway {
  return {
    async list(options): Promise<readonly Employee[]> {
      const response = await client.get<unknown>('/cabinet/employees', options)
      return mapEmployees(response)
    },

    async create(input, options): Promise<Employee> {
      const response = await client.post<unknown>('/cabinet/employees', input, options)
      return mapEmployee(response)
    },

    async update(id, input, options): Promise<Employee> {
      const response = await client.patch<unknown>(`/cabinet/employees/${id}`, input, options)
      return mapEmployee(response)
    },

    async remove(id, options): Promise<void> {
      await client.delete(`/cabinet/employees/${id}`, options)
    },
  }
}

export const employeesGateway = createHttpEmployeesGateway(api)
