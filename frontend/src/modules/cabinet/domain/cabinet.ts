export type CabinetTab = 'overview' | 'integrations' | 'team'

export type CabinetSubscriptionStatus = 'active' | 'inactive'

export type CabinetCompany = {
  readonly id: number
  readonly name: string
  readonly email: string
  readonly emailVerified: boolean
  readonly subscriptionStatus: CabinetSubscriptionStatus
  readonly phones: readonly CabinetPhone[]
  readonly messengers: readonly CabinetMessenger[]
  readonly createdAt: string
}

export type CabinetPhone = {
  readonly id: number
  readonly phone: string
  readonly label: string | null
}

export type CabinetMessenger = {
  readonly id: number
  readonly name: string
  readonly contact: string
}

export type CabinetIntegration = {
  readonly id: number
  readonly companyId: number
  readonly name: string
  readonly odataUrl: string
  readonly login: string
  readonly configName: string
  readonly isActive: boolean
  readonly status: 'active' | 'inactive'
}

export type CabinetEmployee = {
  readonly id: number
  readonly companyId: number
  readonly name: string
  readonly position: string
  readonly login: string
  readonly isOnline: boolean
  readonly lastSeenAt: string | null
}

export type CabinetDashboard = {
  readonly company: CabinetCompany
  readonly integrations: {
    readonly count: number
    readonly activeCount: number
    readonly items: readonly CabinetIntegration[]
  }
  readonly employees?: {
    readonly count: number
    readonly onlineCount: number
    readonly items: readonly CabinetEmployee[]
  }
}

export type CabinetOverview = {
  name: string
  initials: string
  integrations: {
    id: string
    name: string
    configuration: string
    connected: boolean
  }[]
  subscription: { status: 'active' | 'expired'; validUntil: string }
  telegramBots: number
}

export function describeCabinet(overview: CabinetOverview) {
  return `Интеграций: ${overview.integrations.length} · Telegram-ботов: ${overview.telegramBots}`
}
