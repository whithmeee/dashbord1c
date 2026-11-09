export const employeeSections = ['finance', 'integrations', 'statistics', 'subscription', 'system_status', 'chat'] as const

export type EmployeeSection = typeof employeeSections[number]

export type Employee = {
  readonly id: number
  readonly companyId: number
  readonly name: string
  readonly position: string
  readonly login: string
  readonly sections: readonly EmployeeSection[]
  readonly isOnline: boolean
  readonly lastSeenAt: string | null
  readonly createdAt: string | null
}

export type CreateEmployeeInput = {
  readonly name: string
  readonly position: string
  readonly login: string
  readonly password: string
  readonly sections?: readonly EmployeeSection[]
}

export type UpdateEmployeeInput = {
  readonly name?: string
  readonly position?: string
  readonly login?: string
  readonly password?: string
  readonly sections?: readonly EmployeeSection[]
}
