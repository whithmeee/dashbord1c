import { describe, expect, it } from 'vitest'
import { InvalidEmployeeError, mapEmployee, mapEmployees } from './employee-mapper'

describe('employee mapper', () => {
  it('maps an employee DTO without exposing a password', () => {
    expect(mapEmployee({
      id: 4,
      company_id: 2,
      name: 'Иван Петров',
      position: 'Бухгалтер',
      login: 'ivan_petrov',
      sections: ['finance', 'chat'],
      is_online: true,
      last_seen_at: '2026-11-06T10:00:00Z',
      created_at: '2026-10-01T08:00:00Z',
      password: 'secret-pass1',
    })).toEqual({
      id: 4,
      companyId: 2,
      name: 'Иван Петров',
      position: 'Бухгалтер',
      login: 'ivan_petrov',
      sections: ['finance', 'chat'],
      isOnline: true,
      lastSeenAt: '2026-11-06T10:00:00Z',
      createdAt: '2026-10-01T08:00:00Z',
    })
  })

  it('maps nullable last_seen_at and empty lists', () => {
    expect(mapEmployees([])).toEqual([])
    expect(mapEmployee({
      id: 4,
      company_id: 2,
      name: 'Иван',
      position: 'Менеджер',
      login: 'ivan',
      sections: [],
      is_online: false,
      last_seen_at: null,
    }).lastSeenAt).toBeNull()
  })

  it('rejects a DTO with a missing required field', () => {
    expect(() => mapEmployee({
      id: 4,
      company_id: 2,
      name: 'Иван',
      position: 'Менеджер',
      login: 'ivan',
      is_online: false,
    })).toThrow(InvalidEmployeeError)
  })
})
