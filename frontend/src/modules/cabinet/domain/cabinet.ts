export type CabinetTab =
  'overview' | 'integrations' | 'telegram' | 'team' | 'subscription' | 'plan'

export type CabinetOverview = {
  name: string
  initials: string
  integrations: {
    id: string
    name: string
    configuration: string
    connected: boolean
  }[]
  telegramBots: number
  subscription: { label: string; daysRemaining: number; validUntil: string }
  plan: { name: string; availableFeatures: number; totalFeatures: number }
}

export function describeCabinet(overview: CabinetOverview) {
  return `Интеграций: ${overview.integrations.length} · Telegram-ботов: ${overview.telegramBots}`
}
