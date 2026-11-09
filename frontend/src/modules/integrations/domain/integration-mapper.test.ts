import { describe, expect, it } from 'vitest'
import { InvalidIntegrationError, mapIntegrationCheck, mapIntegrations } from './integration-mapper'

const integration = {
  id: 3,
  name: 'Основная база',
  config_name: 'Бухгалтерия предприятия',
  connected_at: '2026-10-15T09:30:00.000000Z',
  is_active: true,
  status: 'active',
}

describe('integration mappers', () => {
  it('maps an integration collection', () => {
    expect(mapIntegrations([integration])).toEqual([{
      id: 3,
      name: 'Основная база',
      configName: 'Бухгалтерия предприятия',
      connectedAt: '2026-10-15T09:30:00.000000Z',
      isActive: true,
      status: 'active',
    }])
  })

  it('keeps an empty collection empty', () => {
    expect(mapIntegrations([])).toEqual([])
  })

  it('maps administrative inactive status', () => {
    expect(mapIntegrations([{ ...integration, is_active: false, status: 'inactive' }])[0].status)
      .toBe('inactive')
  })

  it('maps live check statuses and checked timestamp', () => {
    expect(mapIntegrationCheck({ id: 3, status: 'offline', checked_at: '2026-11-05T12:00:00Z' }))
      .toEqual({ id: 3, status: 'offline', checkedAt: '2026-11-05T12:00:00Z' })
    expect(mapIntegrationCheck({ id: 3, status: 'inactive', checked_at: '2026-11-05T12:00:00Z' }).status)
      .toBe('inactive')
  })

  it('rejects missing required fields and invalid statuses', () => {
    expect(() => mapIntegrations([{ ...integration, name: undefined }])).toThrow(InvalidIntegrationError)
    expect(() => mapIntegrations([{ ...integration, status: 'online' }])).toThrow(InvalidIntegrationError)
    expect(() => mapIntegrationCheck({ id: 3, status: 'active', checked_at: 'now' }))
      .toThrow(InvalidIntegrationError)
  })
})

describe('integration mapper without optional backend fields', () => {
  it('accepts a base without configuration name and connection date', () => {
    const integrations = mapIntegrations([{ id: 2, name: 'Филиал', config_name: null, is_active: true, status: 'active' }])

    expect(integrations[0]).toMatchObject({ id: 2, configName: null, connectedAt: null })
  })
})
