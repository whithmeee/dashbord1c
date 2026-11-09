export type CabinetTab = 'overview' | 'integrations' | 'team'

export type CabinetSubscriptionStatus = 'active' | 'inactive'

export type CabinetCompany = {
  readonly id: number
  readonly name: string
  readonly email: string
  readonly emailVerified: boolean
  readonly subscriptionStatus?: CabinetSubscriptionStatus
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
  readonly configName: string | null
  readonly connectedAt: string | null
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

export type CabinetViewer =
  | { readonly type: 'employee'; readonly name: string; readonly position: string }
  | { readonly type: 'company'; readonly name: string; readonly position: null }

export type CabinetDashboard = {
  readonly company: CabinetCompany
  readonly viewer: CabinetViewer
  readonly integrations?: {
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

export function getCabinetInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return '—'
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

export function describeCabinetDashboard(dashboard: CabinetDashboard): string {
  return dashboard.integrations
    ? `Интеграций: ${dashboard.integrations.count}`
    : 'Рабочее пространство компании'
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
