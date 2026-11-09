import { describe, expect, it } from 'vitest'
import { InvalidEmployeeActivityError, mapEmployeeActivity } from './employee-activity-mapper'

describe('employee activity mapper', () => {
  it('maps profile activity without changing question text', () => {
    expect(mapEmployeeActivity({
      last_login_at: '2026-11-10T08:00:00Z',
      last_logout_at: null,
      questions_count: 1,
      items: [{ type: 'question', at: '2026-11-10T09:00:00Z', details: 'Покажи отчёт' }],
    })).toEqual({
      lastLoginAt: '2026-11-10T08:00:00Z',
      lastLogoutAt: null,
      questionsCount: 1,
      items: [{ type: 'question', at: '2026-11-10T09:00:00Z', details: 'Покажи отчёт' }],
    })
  })

  it('rejects an invalid activity item type', () => {
    expect(() => mapEmployeeActivity({ last_login_at: null, last_logout_at: null, questions_count: 0, items: [{ type: 'unknown', at: '', details: null }] })).toThrow(InvalidEmployeeActivityError)
  })
})
