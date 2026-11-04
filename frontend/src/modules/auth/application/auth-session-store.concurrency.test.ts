import { describe, expect, it, vi } from 'vitest'
import { createAuthSessionStore } from './auth-session-store'
import {
  companySession,
  createGateway,
  credentials,
  deferred,
  unverifiedCompanySession,
} from './auth-session-store.test-data'

describe.skip('auth session store concurrency and subscriptions', () => {
  it('does not let stale restore replace a newer login', async () => {
    const gateway = createGateway()
    const restore = deferred<typeof unverifiedCompanySession>()
    vi.mocked(gateway.getSession).mockReturnValue(restore.promise)
    vi.mocked(gateway.login).mockResolvedValue(companySession)
    const store = createAuthSessionStore(gateway)

    const restoring = store.restore()
    await store.login(credentials)
    restore.resolve(unverifiedCompanySession)
    await restoring

    expect(store.getSnapshot()).toMatchObject({
      status: 'authenticated-client',
      session: companySession,
    })
  })

  it('does not let stale login replace a successful logout', async () => {
    const gateway = createGateway()
    const login = deferred<typeof companySession>()
    vi.mocked(gateway.login).mockReturnValue(login.promise)
    vi.mocked(gateway.logout).mockResolvedValue()
    const store = createAuthSessionStore(gateway)

    const signingIn = store.login(credentials)
    await store.logout()
    login.resolve(companySession)
    await signingIn

    expect(store.getSnapshot()).toEqual({ status: 'guest' })
  })

  it('single-flights repeated login, verify, and resend operations', async () => {
    const gateway = createGateway()
    vi.mocked(gateway.login).mockResolvedValue(unverifiedCompanySession)
    vi.mocked(gateway.verifyEmail).mockResolvedValue(companySession)
    vi.mocked(gateway.resendEmailCode).mockResolvedValue('Код отправлен.')
    const store = createAuthSessionStore(gateway)

    await Promise.all([store.login(credentials), store.login(credentials)])
    await Promise.all([store.resendEmailCode(), store.resendEmailCode()])
    await Promise.all([store.verifyEmail('123456'), store.verifyEmail('123456')])

    expect(gateway.login).toHaveBeenCalledOnce()
    expect(gateway.resendEmailCode).toHaveBeenCalledOnce()
    expect(gateway.verifyEmail).toHaveBeenCalledOnce()
  })

  it('notifies active subscribers and cleans up unsubscribed listeners', () => {
    const store = createAuthSessionStore(createGateway())
    const active = vi.fn()
    const removed = vi.fn()
    store.subscribe(active)
    const unsubscribe = store.subscribe(removed)
    unsubscribe()

    store.expireSession()

    expect(active).toHaveBeenCalledOnce()
    expect(removed).not.toHaveBeenCalled()
  })
})
