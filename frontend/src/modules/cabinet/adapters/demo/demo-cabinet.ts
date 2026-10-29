import type { CabinetOverview } from '../../domain/cabinet'

export function getDemoCabinet(): CabinetOverview {
  return {
    name: 'Мой Тай',
    initials: 'МТ',
    integrations: [
      {
        id: 'demo-1c',
        name: '1С Тест',
        configuration: '1С:Бухгалтерия предприятия 3.0',
        connected: true,
      },
    ],
    telegramBots: 0,
    subscription: {
      label: 'Пробный период',
      daysRemaining: 14,
      validUntil: '11 ноября 2026, 23:42',
    },
    plan: { name: 'Индивидуальный', availableFeatures: 17, totalFeatures: 17 },
  }
}
