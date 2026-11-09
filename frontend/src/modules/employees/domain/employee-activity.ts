export type EmployeeActivityItemType = 'login' | 'logout' | 'question'

export type EmployeeActivityItem = {
  readonly type: EmployeeActivityItemType
  readonly at: string
  readonly details: string | null
}

export type EmployeeActivityProfile = {
  readonly lastLoginAt: string | null
  readonly lastLogoutAt: string | null
  readonly questionsCount: number
  readonly items: readonly EmployeeActivityItem[]
}
