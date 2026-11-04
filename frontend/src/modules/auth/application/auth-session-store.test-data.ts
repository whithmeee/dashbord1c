import { vi } from 'vitest'
import type { AuthSession } from '../domain/auth-session'
import type {
  AuthGateway,
  EmployeeAccess,
  LoginCredentials,
} from './auth-gateway'

export const credentials: LoginCredentials = {
  login: 'owner@example.test',
  password: 'secret-pass1',
}

export const companySession: AuthSession = {
  type: 'company',
  account: {
    id: 1,
    name: 'ООО Осминог',
    email: 'owner@example.test',
    emailVerified: true,
    subscriptionStatus: 'active',
    phones: [],
    messengers: [],
    createdAt: '2026-11-04T10:00:00Z',
  },
}

export const inactiveCompanySession: AuthSession = {
  type: 'company',
  account: { ...companySession.account, subscriptionStatus: 'inactive' },
}

export const unverifiedCompanySession: AuthSession = {
  type: 'company',
  account: { ...companySession.account, emailVerified: false },
}

export const employeeSession: AuthSession = {
  type: 'employee',
  account: {
    id: 2,
    companyId: 1,
    name: 'Сотрудник',
    position: 'Бухгалтер',
    login: 'employee',
    isOnline: true,
  },
}

export const adminSession: AuthSession = {
  type: 'admin',
  account: {
    id: 3,
    name: 'Администратор',
    email: 'admin@example.test',
    role: { id: 1, name: 'admin', label: 'Администратор' },
    isAdmin: true,
    createdAt: '2026-11-04T10:00:00Z',
  },
}

export function createGateway(): AuthGateway {
  return {
    login: vi.fn(),
    getSession: vi.fn(),
    logout: vi.fn(),
    verifyEmail: vi.fn(),
    resendEmailCode: vi.fn(),
    probeEmployeeAccess: vi.fn<() => Promise<EmployeeAccess>>(),
  }
}

export function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}
