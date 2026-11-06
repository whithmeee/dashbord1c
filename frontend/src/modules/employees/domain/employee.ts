export type Employee = {
  readonly id: number
  readonly companyId: number
  readonly name: string
  readonly position: string
  readonly login: string
  readonly isOnline: boolean
  readonly lastSeenAt: string | null
}

export type CreateEmployeeInput = {
  readonly name: string
  readonly position: string
  readonly login: string
  readonly password: string
}

export type UpdateEmployeeInput = {
  readonly name?: string
  readonly position?: string
  readonly login?: string
  readonly password?: string
}
