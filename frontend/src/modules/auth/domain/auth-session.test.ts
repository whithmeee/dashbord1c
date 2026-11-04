import { describe, expect, it } from 'vitest'
import { parseAuthSession } from './auth-session'

describe.skip('auth session', () => {
  it('maps a company response', () => {
    expect(parseAuthSession({
      type: 'company',
      account: {
        id: 1,
        name: 'ООО Осминог',
        email: 'owner@example.test',
        email_verified: false,
        subscription_status: 'inactive',
        phones: [{ id: 2, phone: '+79990000000', label: null }],
        messengers: [{ id: 3, name: 'Telegram', contact: '@osminog' }],
        created_at: '2026-11-04T10:00:00.000000Z',
      },
    })).toEqual({
      type: 'company',
      account: {
        id: 1,
        name: 'ООО Осминог',
        email: 'owner@example.test',
        emailVerified: false,
        subscriptionStatus: 'inactive',
        phones: [{ id: 2, phone: '+79990000000' }],
        messengers: [{ id: 3, name: 'Telegram', contact: '@osminog' }],
        createdAt: '2026-11-04T10:00:00.000000Z',
      },
    })
  })

  it('maps an employee response', () => {
    expect(parseAuthSession({
      type: 'employee',
      account: {
        id: 4,
        company_id: 1,
        name: 'Иван',
        position: 'Бухгалтер',
        login: 'ivan',
        is_online: true,
        last_seen_at: null,
      },
    })).toEqual({
      type: 'employee',
      account: {
        id: 4,
        companyId: 1,
        name: 'Иван',
        position: 'Бухгалтер',
        login: 'ivan',
        isOnline: true,
      },
    })
  })

  it('maps a real administrator response', () => {
    expect(parseAuthSession({
      type: 'admin',
      account: {
        id: 5,
        name: 'Администратор',
        email: 'admin@example.test',
        phone_number: null,
        role: { id: 1, name: 'admin', label: 'Администратор' },
        is_admin: true,
        created_at: '2026-11-04T10:00:00.000000Z',
      },
    })).toMatchObject({
      type: 'admin',
      account: { id: 5, isAdmin: true, phoneNumber: undefined },
    })
  })

  it('rejects an ordinary staff user classified as admin', () => {
    expect(() => parseAuthSession({
      type: 'admin',
      account: {
        id: 6,
        name: 'Сотрудник',
        email: 'staff@example.test',
        phone_number: null,
        role: { id: 2, name: 'user', label: 'Пользователь' },
        is_admin: false,
        created_at: '2026-11-04T10:00:00.000000Z',
      },
    })).toThrow('Administrator privileges are required')
  })

  it('rejects unknown types and missing required fields', () => {
    expect(() => parseAuthSession({ type: 'partner', account: {} })).toThrow(
      'Unknown auth session type',
    )
    expect(() => parseAuthSession({
      type: 'employee',
      account: { id: 1 },
    })).toThrow('account.company_id must be a number')
  })
})
