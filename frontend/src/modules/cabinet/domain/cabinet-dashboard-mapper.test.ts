import { describe, expect, it } from 'vitest'
import {
  InvalidCabinetDashboardError,
  mapCabinetDashboard,
} from './cabinet-dashboard-mapper'
import { describeCabinetDashboard, getCabinetInitials } from './cabinet'

const company = {
  id: 1,
  name: 'Осминог',
  email: 'owner@example.com',
  email_verified: true,
  subscription_status: 'inactive',
  phones: [],
  messengers: [],
  created_at: '2026-11-05T00:00:00Z',
}

const integration = {
  id: 3,
  company_id: 1,
  name: 'Основная база',
  odata_url: 'https://1cfresh.example/odata',
  login: 'odata',
  config_name: 'Бухгалтерия предприятия',
  connected_at: '2026-10-15T09:30:00.000000Z',
  is_active: true,
  status: 'active',
}

describe('mapCabinetDashboard', () => {
  it('maps company and subscription status', () => {
    const result = mapCabinetDashboard({
      company,
      integrations: { count: 1, active_count: 1, items: [integration] },
    })

    expect(result.company.subscriptionStatus).toBe('inactive')
    expect(result.company.emailVerified).toBe(true)
    expect(result.company.name).toBe('Осминог')
  })

  it('maps integration list and counters', () => {
    const result = mapCabinetDashboard({
      company,
      integrations: { count: 1, active_count: 1, items: [integration] },
    })

    expect(result.integrations).toEqual({
      count: 1,
      activeCount: 1,
      items: [{
        id: 3,
        companyId: 1,
        name: 'Основная база',
        odataUrl: 'https://1cfresh.example/odata',
        login: 'odata',
        configName: 'Бухгалтерия предприятия',
        connectedAt: '2026-10-15T09:30:00.000000Z',
        isActive: true,
        status: 'active',
      }],
    })
  })

  it('keeps nullable employee fields and absent employee block', () => {
    const employeeResult = mapCabinetDashboard({
      company,
      integrations: { count: 0, active_count: 0, items: [] },
      employees: {
        count: 1,
        online_count: 0,
        items: [{
          id: 8,
          company_id: 1,
          name: 'Иван',
          position: 'Бухгалтер',
          login: 'ivan',
          is_online: false,
          last_seen_at: null,
        }],
      },
    })

    expect(employeeResult.employees?.items[0].lastSeenAt).toBeNull()
    expect(mapCabinetDashboard({
      company,
      integrations: { count: 0, active_count: 0, items: [] },
    }).employees).toBeUndefined()
  })

  it('supports empty collections and rejects an invalid required payload', () => {
    expect(mapCabinetDashboard({
      company: { ...company, phones: [], messengers: [] },
      integrations: { count: 0, active_count: 0, items: [] },
    }).integrations.items).toEqual([])

    expect(() => mapCabinetDashboard({ company })).toThrow(
      InvalidCabinetDashboardError,
    )
  })

  it('derives compact company initials and a real dashboard description', () => {
    const dashboard = mapCabinetDashboard({
      company,
      integrations: { count: 2, active_count: 1, items: [] },
    })

    expect(getCabinetInitials(dashboard.company.name)).toBe('ОС')
    expect(getCabinetInitials('Мой Тай')).toBe('МТ')
    expect(describeCabinetDashboard(dashboard)).toBe('Интеграций: 2')
  })
})
