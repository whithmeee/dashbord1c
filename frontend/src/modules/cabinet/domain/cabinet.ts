export type CabinetTab = 'overview' | 'integrations' | 'team'

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
