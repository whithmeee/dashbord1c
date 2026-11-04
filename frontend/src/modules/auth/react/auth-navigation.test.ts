import { describe, expect, it } from 'vitest'
import { companySession } from '../application/auth-session-store.test-data'
import { getRequiredAuthPath } from './auth-navigation'

describe.skip('auth navigation', () => {
  it('keeps guest and signing-in states on auth route', () => {
    expect(getRequiredAuthPath({ status: 'guest' })).toBe('/auth')
    expect(getRequiredAuthPath({ status: 'signing-in' })).toBe('/auth')
  })

  it('does not let a protected URL bypass session checking', () => {
    expect(getRequiredAuthPath({ status: 'checking' })).toBeUndefined()
    expect(
      getRequiredAuthPath({ status: 'unavailable', error: new Error('offline') }),
    ).toBeUndefined()
  })

  it('sends an authenticated client to the application root', () => {
    expect(
      getRequiredAuthPath({
        status: 'authenticated-client',
        session: companySession,
      }),
    ).toBe('/')
  })
})
