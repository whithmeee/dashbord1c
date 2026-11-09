import { describe, expect, it } from 'vitest'
import type { AuthSession, CompanyAccount, EmployeeAccount } from './auth-session'
import { sectionAccessFor } from './section-access'

const company: CompanyAccount = {
  id: 1,
  name: 'ООО Ромашка',
  email: 'd@r.test',
  emailVerified: true,
  subscriptionStatus: 'active',
  phones: [],
  messengers: [],
  createdAt: '2026-10-01T00:00:00Z',
}

const employee = (sections?: EmployeeAccount['sections']): AuthSession => ({
  type: 'employee',
  account: {
    id: 5,
    companyId: 1,
    name: 'Иван',
    position: 'Бухгалтер',
    login: 'ivan',
    isOnline: true,
    sections,
  },
})

describe('section access', () => {
  it('lets the company owner open every section', () => {
    const access = sectionAccessFor({ type: 'company', account: company })

    expect(access('analytics')).toBe(true)
    expect(access('chat')).toBe(true)
  })

  it('opens only the sections granted to an employee', () => {
    const access = sectionAccessFor(employee(['chat']))

    expect(access('chat')).toBe(true)
    expect(access('analytics')).toBe(false)
    expect(access('integrations')).toBe(false)
  })

  it('opens every section for an employee when the backend sends no list', () => {
    expect(sectionAccessFor(employee())('analytics')).toBe(true)
  })

  it('closes everything for an employee with an empty list', () => {
    expect(sectionAccessFor(employee([]))('chat')).toBe(false)
  })
})
