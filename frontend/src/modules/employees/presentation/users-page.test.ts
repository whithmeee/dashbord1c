import { describe, expect, it } from 'vitest'
import type { Employee } from '../domain/employee'
import { buildEmployeeUpdateInput, canManageEmployees } from './users-page-helpers'

const employee: Employee = {
  id: 1,
  companyId: 3,
  name: 'Иван',
  position: 'Бухгалтер',
  login: 'ivan',
  sections: ['finance', 'chat'],
  isOnline: false,
  lastSeenAt: null,
  createdAt: null,
}

describe('users presentation helpers', () => {
  it('builds an update with only changed fields and omits an empty password', () => {
    expect(buildEmployeeUpdateInput(employee, {
      name: 'Иван',
      position: 'Главбух',
      login: 'ivan',
      password: '',
    })).toEqual({ position: 'Главбух' })
  })

  it('includes changed employee sections in an update', () => {
    expect(buildEmployeeUpdateInput(employee, {
      name: employee.name,
      position: employee.position,
      login: employee.login,
      password: '',
      sections: ['statistics'],
    })).toEqual({ sections: ['statistics'] })
  })

  it('allows management only for a company session', () => {
    expect(canManageEmployees('company')).toBe(true)
    expect(canManageEmployees('employee')).toBe(false)
  })
})
