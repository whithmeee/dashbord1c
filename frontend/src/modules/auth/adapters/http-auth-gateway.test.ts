import { describe, expect, it, vi } from 'vitest'
import type { ApiClient } from '../../../shared/api'
import { ApiError } from '../../../shared/api'
import { createHttpAuthGateway } from './http-auth-gateway'

function companyResponse() {
  return {
    type: 'company',
    account: {
      id: 1,
      name: 'ООО Осминог',
      email: 'owner@example.test',
      email_verified: true,
      subscription_status: 'active',
      phones: [],
      messengers: [],
      created_at: '2026-11-04T10:00:00.000000Z',
    },
  }
}

function createClient(): ApiClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }
}

describe('HTTP auth gateway', () => {
  it('uses exact auth endpoints and payloads', async () => {
    const client = createClient()
    vi.mocked(client.post)
      .mockResolvedValueOnce(companyResponse())
      .mockResolvedValueOnce(companyResponse())
      .mockResolvedValueOnce({ message: 'Код отправлен на почту.' })
      .mockResolvedValueOnce({ message: 'Вы вышли из системы.' })
    vi.mocked(client.get).mockResolvedValueOnce(companyResponse())
    const gateway = createHttpAuthGateway(client)

    await gateway.login({ login: 'owner@example.test', password: 'secret-pass1' })
    await gateway.getSession()
    await gateway.verifyEmail('123456')
    await gateway.resendEmailCode()
    await gateway.logout()

    expect(client.post).toHaveBeenNthCalledWith(1, '/auth/login', {
      login: 'owner@example.test',
      password: 'secret-pass1',
    })
    expect(client.get).toHaveBeenCalledWith('/auth/me')
    expect(client.post).toHaveBeenNthCalledWith(2, '/auth/email/verify', {
      code: '123456',
    })
    expect(client.post).toHaveBeenNthCalledWith(3, '/auth/email/resend')
    expect(client.post).toHaveBeenNthCalledWith(4, '/auth/logout')
  })

  it('preserves structured API errors', async () => {
    const client = createClient()
    const error = new ApiError('The given data was invalid.', {
      kind: 'http',
      status: 422,
      validationErrors: { login: ['Неверные учетные данные.'] },
    })
    vi.mocked(client.post).mockRejectedValueOnce(error)
    const gateway = createHttpAuthGateway(client)

    await expect(gateway.login({ login: 'wrong', password: 'wrong' }))
      .rejects.toBe(error)
  })

  it.each([401, 403, 429])('preserves HTTP %s errors', async (status) => {
    const client = createClient()
    const error = new ApiError('Request rejected', {
      kind: 'http',
      status,
    })
    vi.mocked(client.get).mockRejectedValueOnce(error)
    const gateway = createHttpAuthGateway(client)

    await expect(gateway.getSession()).rejects.toBe(error)
  })

  it('classifies employee email access without exposing cabinet data', async () => {
    const client = createClient()
    vi.mocked(client.get)
      .mockResolvedValueOnce({ company: { subscription_status: 'inactive' } })
      .mockRejectedValueOnce(new ApiError('Подтвердите почту компании.', {
        kind: 'http',
        status: 403,
        code: 'email_verification_required',
      }))
    const gateway = createHttpAuthGateway(client)

    await expect(gateway.probeEmployeeAccess()).resolves.toBe('allowed')
    await expect(gateway.probeEmployeeAccess()).resolves.toBe(
      'email-verification-required',
    )
    expect(client.get).toHaveBeenNthCalledWith(1, '/cabinet/dashboard')
    expect(client.get).toHaveBeenNthCalledWith(2, '/cabinet/dashboard')
  })

  it('does not persist credentials or session data in Web Storage', async () => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', { setItem })
    vi.stubGlobal('sessionStorage', { setItem })
    const client = createClient()
    vi.mocked(client.post).mockResolvedValueOnce(companyResponse())
    const gateway = createHttpAuthGateway(client)

    await gateway.login({ login: 'owner@example.test', password: 'secret-pass1' })

    expect(setItem).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
