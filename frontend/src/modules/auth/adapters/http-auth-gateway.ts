import { api, ApiError, type ApiClient } from '../../../shared/api'
import type {
  AuthGateway,
  EmployeeAccess,
  LoginCredentials,
} from '../application/auth-gateway'
import { parseAuthSession } from '../domain/auth-session-mapper'
import type { AuthSession } from '../domain/auth-session'

type MessageResponse = {
  message: string
}

export function createHttpAuthGateway(client: ApiClient): AuthGateway {
  return {
    async login(credentials: LoginCredentials): Promise<AuthSession> {
      const response = await client.post<unknown>('/auth/login', credentials)

      return parseAuthSession(response)
    },

    async getSession(): Promise<AuthSession> {
      const response = await client.get<unknown>('/auth/me')

      return parseAuthSession(response)
    },

    async logout(): Promise<void> {
      await client.post<MessageResponse>('/auth/logout')
    },

    async verifyEmail(code: string): Promise<AuthSession> {
      const response = await client.post<unknown>('/auth/email/verify', { code })

      return parseAuthSession(response)
    },

    async resendEmailCode(): Promise<string> {
      const response = await client.post<MessageResponse>('/auth/email/resend')

      return response.message
    },

    async probeEmployeeAccess(): Promise<EmployeeAccess> {
      try {
        await client.get<unknown>('/cabinet/dashboard')

        return 'allowed'
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 403 &&
          error.code === 'email_verification_required'
        ) {
          return 'email-verification-required'
        }

        throw error
      }
    },
  }
}

export const authGateway = createHttpAuthGateway(api)
