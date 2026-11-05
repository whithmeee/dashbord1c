import type { Employee, UpdateEmployeeInput } from '../domain/employee'
import type { EmployeeFormValues } from './employee-form'

export function canManageEmployees(type: 'company' | 'employee'): boolean {
  return type === 'company'
}

export function buildEmployeeUpdateInput(employee: Employee, values: EmployeeFormValues): UpdateEmployeeInput {
  const input: { name?: string; position?: string; login?: string; password?: string } = {}
  if (values.name !== employee.name) input.name = values.name
  if (values.position !== employee.position) input.position = values.position
  if (values.login !== employee.login) input.login = values.login
  if (values.password) input.password = values.password
  return input
}
