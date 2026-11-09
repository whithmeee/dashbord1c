import type { SectionKey } from './section-access'

export type SubscriptionStatus = 'active' | 'inactive'

export type CompanyPhone = {
  readonly id: number
  readonly phone: string
  readonly label?: string
}

export type CompanyMessenger = {
  readonly id: number
  readonly name: string
  readonly contact: string
}

export type CompanyAccount = {
  readonly id: number
  readonly name: string
  readonly email: string
  readonly emailVerified: boolean
  readonly subscriptionStatus: SubscriptionStatus
  readonly phones: readonly CompanyPhone[]
  readonly messengers: readonly CompanyMessenger[]
  readonly createdAt: string
}

export type EmployeeAccount = {
  readonly id: number
  readonly companyId: number
  readonly name: string
  readonly position: string
  readonly login: string
  readonly isOnline: boolean
  readonly lastSeenAt?: string
  readonly sections?: readonly SectionKey[]
}

export type AdminRole = {
  readonly id: number
  readonly name: string
  readonly label: string
}

export type AdminAccount = {
  readonly id: number
  readonly name: string
  readonly email: string
  readonly phoneNumber?: string
  readonly role: AdminRole
  readonly isAdmin: true
  readonly createdAt: string
}

export type AuthSession =
  | { readonly type: 'company'; readonly account: CompanyAccount }
  | { readonly type: 'employee'; readonly account: EmployeeAccount }
  | { readonly type: 'admin'; readonly account: AdminAccount }
