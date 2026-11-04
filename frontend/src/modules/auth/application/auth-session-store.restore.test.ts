import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api'
import { createAuthSessionStore } from './auth-session-store'
import {
  adminSession,
  companySession,
  createGateway,
  deferred,
  employeeSession,
} from './auth-session-store.test-data'

describe.skip('auth session store restoration', () => {
  it('starts in checking state', () => {
    const store = createAuthSessionStore(createGateway())

    expect(store.getSnapshot()).toEqual({ status: 'checking' })
  })

  it.each([
    [companySession, 'authenticated-client'],
    [adminSession, 'authenticated-admin-unavailable'],
  ] as const)('restores %s session', async (session, status) => {
    const gateway = createGateway()
    vi.mocked(gateway.getSession).mockResolvedValue(session)
    const store = createAuthSessionStore(gateway)

    await store.restore()

    expect(store.getSnapshot()).toMatchObject({ status, session })
  })

  it('verifies employee access before restoring it', async () => {
    const gateway = createGateway()
    vi.mocked(gateway.getSession).mockResolvedValue(employeeSession)
    vi.mocked(gateway.probeEmployeeAccess).mockResolvedValue('allowed')
    const store = createAuthSessionStore(gateway)

    await store.restore()

    expect(gateway.probeEmployeeAccess).toHaveBeenCalledOnce()
    expect(store.getSnapshot()).toMatchObject({
      status: 'authenticated-client',
      session: employeeSession,
    })
  })

  it('distinguishes an employee awaiting owner verification', async () => {
    const gateway = createGateway()
    vi.mocked(gateway.getSession).mockResolvedValue(employeeSession)
    vi.mocked(gateway.probeEmployeeAccess).mockResolvedValue(
      'email-verification-required',
    )
    const store = createAuthSessionStore(gateway)

    await store.restore()

    expect(store.getSnapshot()).toMatchObject({
      status: 'verification-required-employee',
      session: employeeSession,
    })
  })

  it('maps 401 to guest and temporary failures to unavailable', async () => {
    const unauthorizedGateway = createGateway()
    vi.mocked(unauthorizedGateway.getSession).mockRejectedValue(
      new ApiError('Unauthenticated.', { kind: 'http', status: 401 }),
    )
    const unavailableGateway = createGateway()
    const networkError = ApiError.network(new TypeError('offline'))
    vi.mocked(unavailableGateway.getSession).mockRejectedValue(networkError)
    const unauthorizedStore = createAuthSessionStore(unauthorizedGateway)
    const unavailableStore = createAuthSessionStore(unavailableGateway)

    await unauthorizedStore.restore()
    await unavailableStore.restore()

    expect(unauthorizedStore.getSnapshot()).toEqual({ status: 'guest' })
    expect(unavailableStore.getSnapshot()).toEqual({
      status: 'unavailable',
      error: networkError,
    })
  })

  it('maps server errors to unavailable and allows retry', async () => {
    const gateway = createGateway()
    const serverError = new ApiError('Unavailable', {
      kind: 'http',
      status: 503,
    })
    vi.mocked(gateway.getSession)
      .mockRejectedValueOnce(serverError)
      .mockResolvedValueOnce(companySession)
    const store = createAuthSessionStore(gateway)

    await store.restore()
    await store.restore()

    expect(gateway.getSession).toHaveBeenCalledTimes(2)
    expect(store.getSnapshot()).toMatchObject({
      status: 'authenticated-client',
      session: companySession,
    })
  })

  it('shares one request between parallel restore calls', async () => {
    const gateway = createGateway()
    const pending = deferred<typeof companySession>()
    vi.mocked(gateway.getSession).mockReturnValue(pending.promise)
    const store = createAuthSessionStore(gateway)

    const first = store.restore()
    const second = store.restore()
    pending.resolve(companySession)
    await Promise.all([first, second])

    expect(gateway.getSession).toHaveBeenCalledOnce()
  })
})
