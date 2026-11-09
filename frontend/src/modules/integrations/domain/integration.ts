export type IntegrationStatus = 'active' | 'inactive'

export type IntegrationCheckStatus = 'online' | 'offline' | 'inactive'

export type Integration = {
  readonly id: number
  readonly name: string
  readonly configName: string | null
  readonly connectedAt: string | null
  readonly isActive: boolean
  readonly status: IntegrationStatus
}

export type IntegrationCheck = {
  readonly id: number
  readonly status: IntegrationCheckStatus
  readonly checkedAt: string
}
