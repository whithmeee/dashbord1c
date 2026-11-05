import { describe, expect, it } from 'vitest'
import type { Employee } from '../domain/employee'
import { buildEmployeeUpdateInput, canManageEmployees } from './users-page'

const employee: Employee = {
  id: 1,
  companyId: 3,
  name: 'Иван',
  position: 'Бухгалтер',
  login: 'ivan',
  isOnline: false,
  lastSeenAt: null,
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

  it('allows management only for a company session', () => {
    expect(canManageEmployees('company')).toBe(true)
    expect(canManageEmployees('employee')).toBe(false)
  })
})
