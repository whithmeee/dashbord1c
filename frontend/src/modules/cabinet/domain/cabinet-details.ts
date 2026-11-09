export type CabinetSystemState = 'operational' | 'degraded' | 'inactive'
export type CabinetIntegrationState = 'active' | 'inactive'
export type CabinetIntegrationReason = 'disabled' | 'unreachable' | null
export type CabinetSubscriptionState = 'active' | 'expired' | 'not_started'

export type CabinetSystemIntegration = {
  readonly id: number
  readonly name: string
  readonly status: CabinetIntegrationState
  readonly reason: CabinetIntegrationReason
  readonly checkedAt: string | null
}

export type CabinetSystemStatus = {
  readonly status: CabinetSystemState
  readonly message: string
  readonly total: number
  readonly activeCount: number
  readonly inactiveCount: number
  readonly integrations: readonly CabinetSystemIntegration[]
}

export type CabinetSubscription = {
  readonly status: 'active' | 'inactive'
  readonly state: CabinetSubscriptionState
  readonly startsAt: string
  readonly endsAt: string
  readonly totalDays: number
  readonly elapsedDays: number
  readonly daysLeft: number
  readonly progressPercent: number
  readonly expiresSoon: boolean
}

export type CabinetStatisticsQuery = {
  readonly period?: 'today' | 'week' | 'month' | 'year'
  readonly month?: string
  readonly from?: string
  readonly to?: string
  readonly group?: 'hour' | 'day' | 'week' | 'month'
  readonly integrationId?: number
}

export type CabinetStatistics = {
  readonly period: { readonly from: string; readonly to: string; readonly group: string }
  readonly total: number
  readonly summary: {
    readonly averagePerDay: number
    readonly activeDays: number
    readonly peakDay: { readonly date: string; readonly requests: number } | null
    readonly lastRequestAt: string | null
  }
  readonly byPeriod: readonly { readonly period: string; readonly requests: number }[]
  readonly byIntegration: readonly { readonly integrationId: number; readonly name: string; readonly requests: number }[]
  readonly byAuthor: readonly { readonly type: string; readonly id: number; readonly name: string; readonly requests: number }[]
}
