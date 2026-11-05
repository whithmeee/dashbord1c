import { describe, expect, it } from 'vitest'
import { getIntegrationCheckLabel, getIntegrationStatusLabel } from './integration-status'

describe('integration status labels', () => {
  it('keeps administrative and live statuses separate', () => {
    expect(getIntegrationStatusLabel('active')).toBe('Активна')
    expect(getIntegrationStatusLabel('inactive')).toBe('Отключена')
    expect(getIntegrationCheckLabel('not_checked')).toBe('Не проверялась')
    expect(getIntegrationCheckLabel('checking')).toBe('Проверка…')
    expect(getIntegrationCheckLabel('online')).toBe('На связи')
    expect(getIntegrationCheckLabel('offline')).toBe('Нет связи')
    expect(getIntegrationCheckLabel('inactive')).toBe('Отключена')
    expect(getIntegrationCheckLabel('error')).toBe('Ошибка проверки')
  })
})
