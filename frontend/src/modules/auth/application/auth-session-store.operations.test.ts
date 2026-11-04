import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api'
import { createAuthSessionStore } from './auth-session-store'
import {
  companySession,
  createGateway,
  credentials,
  employeeSession,
  inactiveCompanySession,
  unverifiedCompanySession,
} from './auth-session-store.test-data'

describe('auth session store operations', () => {
  it('logs in a verified company even with an inactive subscription', async () => {
    const gateway = createGateway()
    vi.mocked(gateway.login).mockResolvedValue(inactiveCompanySession)
    const store = createAuthSessionStore(gateway)

    await store.login(credentials)

    expect(store.getSnapshot()).toMatchObject({
      status: 'authenticated-client',
      session: inactiveCompanySession,
    })
  })

  it('keeps a structured login failure for the UI', async () => {
    const gateway = createGateway()
    const error = new ApiError('Invalid credentials', {
      kind: 'http',
      status: 422,
      validationErrors: { login: ['Неверные учетные данные.'] },
    })
    vi.mocked(gateway.login).mockRejectedValue(error)
    const store = createAuthSessionStore(gateway)

    await expect(store.login(credentials)).rejects.toBe(error)

    expect(store.getSnapshot()).toEqual({ status: 'guest', error })
  })

  it('requires owner verification and verifies the email', async () => {
    const gateway = createGateway()
    vi.mocked(gateway.login).mockResolvedValue(unverifiedCompanySession)
    vi.mocked(gateway.verifyEmail).mockResolvedValue(companySession)
    const store = createAuthSessionStore(gateway)

    await store.login(credentials)
    await store.verifyEmail('123456')

    expect(gateway.verifyEmail).toHaveBeenCalledWith('123456')
    expect(store.getSnapshot()).toMatchObject({
      status: 'authenticated-client',
      session: companySession,
    })
  })

  it('resends the owner verification code and exposes the message', async () => {
    const gateway = createGateway()
    vi.mocked(gateway.login).mockResolvedValue(unverifiedCompanySession)
    vi.mocked(gateway.resendEmailCode).mockResolvedValue('Код отправлен.')
    const store = createAuthSessionStore(gateway)

    await store.login(credentials)
    await expect(store.resendEmailCode()).resolves.toBe('Код отправлен.')

    expect(store.getSnapshot()).toMatchObject({
      status: 'verification-required-owner',
      message: 'Код отправлен.',
    })
  })

  it('does not allow an employee to verify or resend email', async () => {
    const gateway = createGateway()
    vi.mocked(gateway.login).mockResolvedValue(employeeSession)
    vi.mocked(gateway.probeEmployeeAccess).mockResolvedValue(
      'email-verification-required',
    )
    const store = createAuthSessionStore(gateway)
    await store.login(credentials)

    await expect(store.verifyEmail('123456')).rejects.toThrow(
      'Only a company owner can verify email',
    )
    await expect(store.resendEmailCode()).rejects.toThrow(
      'Only a company owner can resend email verification',
    )
    expect(gateway.verifyEmail).not.toHaveBeenCalled()
    expect(gateway.resendEmailCode).not.toHaveBeenCalled()
  })

  it('logs out on success or 401 but preserves session on network error', async () => {
    const successGateway = createGateway()
    vi.mocked(successGateway.login).mockResolvedValue(companySession)
    vi.mocked(successGateway.logout).mockResolvedValue()
    const expiredGateway = createGateway()
    vi.mocked(expiredGateway.login).mockResolvedValue(companySession)
    vi.mocked(expiredGateway.logout).mockRejectedValue(
      new ApiError('Unauthenticated.', { kind: 'http', status: 401 }),
    )
    const failedGateway = createGateway()
    vi.mocked(failedGateway.login).mockResolvedValue(companySession)
    const networkError = ApiError.network(new TypeError('offline'))
    vi.mocked(failedGateway.logout).mockRejectedValue(networkError)
    const stores = [successGateway, expiredGateway, failedGateway].map((gateway) =>
      createAuthSessionStore(gateway),
    )
    await Promise.all(stores.map((store) => store.login(credentials)))

    await stores[0].logout()
    await stores[1].logout()
    await expect(stores[2].logout()).rejects.toBe(networkError)

    expect(stores[0].getSnapshot()).toEqual({ status: 'guest' })
    expect(stores[1].getSnapshot()).toEqual({ status: 'guest' })
    expect(stores[2].getSnapshot()).toMatchObject({
      status: 'authenticated-client',
      session: companySession,
      error: networkError,
    })
  })

  it('expires the local session immediately', async () => {
    const gateway = createGateway()
    vi.mocked(gateway.login).mockResolvedValue(companySession)
    const store = createAuthSessionStore(gateway)
    await store.login(credentials)

    store.expireSession()

    expect(store.getSnapshot()).toEqual({ status: 'guest' })
  })
})
