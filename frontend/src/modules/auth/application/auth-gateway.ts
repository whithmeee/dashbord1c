import type { AuthSession } from '../domain/auth-session'

export type LoginCredentials = {
  readonly login: string
  readonly password: string
}

export type EmployeeAccess = 'allowed' | 'email-verification-required'

export interface AuthGateway {
  login(credentials: LoginCredentials): Promise<AuthSession>
  getSession(): Promise<AuthSession>
  logout(): Promise<void>
  verifyEmail(code: string): Promise<AuthSession>
  resendEmailCode(): Promise<string>
  probeEmployeeAccess(): Promise<EmployeeAccess>
}
