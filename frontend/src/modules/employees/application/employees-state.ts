import type { Employee } from '../domain/employee'

export type EmployeesMutation =
  | { readonly status: 'idle' }
  | { readonly status: 'pending'; readonly operation: 'create' | 'update' | 'remove'; readonly employeeId?: number }
  | {
      readonly status: 'error'
      readonly operation: 'create' | 'update' | 'remove'
      readonly employeeId?: number
      readonly error: Error
      readonly validationErrors?: Record<string, string[]>
    }

export type EmployeesState =
  | { readonly status: 'idle'; readonly mutation?: EmployeesMutation }
  | { readonly status: 'loading'; readonly mutation?: EmployeesMutation }
  | { readonly status: 'success'; readonly employees: readonly Employee[]; readonly mutation?: EmployeesMutation }
  | { readonly status: 'error'; readonly error: Error; readonly sessionExpired?: boolean; readonly mutation?: EmployeesMutation }
