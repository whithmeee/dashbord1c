import type { IntegrationCheckState } from '../application/integrations-store'
import type { IntegrationStatus } from '../domain/integration'

export function getIntegrationStatusLabel(status: IntegrationStatus): string {
  return status === 'active' ? 'Активна' : 'Отключена'
}

export function getIntegrationCheckLabel(status: IntegrationCheckState['status']): string {
  switch (status) {
    case 'not_checked':
      return 'Не проверялась'
    case 'checking':
      return 'Проверка…'
    case 'online':
      return 'На связи'
    case 'offline':
      return 'Нет связи'
    case 'inactive':
      return 'Отключена'
    case 'error':
      return 'Ошибка проверки'
  }
}
