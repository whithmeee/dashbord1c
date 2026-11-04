import type {
  AdminAccount,
  AuthSession,
  CompanyAccount,
  CompanyMessenger,
  CompanyPhone,
  EmployeeAccount,
} from './auth-session'

export class InvalidAuthSessionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidAuthSessionError'
  }
}

export function parseAuthSession(value: unknown): AuthSession {
  const payload = readRecord(value, 'session')
  const account = readRecord(payload.account, 'account')

  switch (payload.type) {
    case 'company':
      return { type: 'company', account: parseCompany(account) }
    case 'employee':
      return { type: 'employee', account: parseEmployee(account) }
    case 'admin':
      return { type: 'admin', account: parseAdmin(account) }
    default:
      throw new InvalidAuthSessionError('Unknown auth session type')
  }
}

function parseCompany(account: Record<string, unknown>): CompanyAccount {
  const subscriptionStatus = readString(
    account.subscription_status,
    'account.subscription_status',
  )

  if (subscriptionStatus !== 'active' && subscriptionStatus !== 'inactive') {
    throw new InvalidAuthSessionError('Unknown subscription status')
  }

  return {
    id: readNumber(account.id, 'account.id'),
    name: readString(account.name, 'account.name'),
    email: readString(account.email, 'account.email'),
    emailVerified: readBoolean(account.email_verified, 'account.email_verified'),
    subscriptionStatus,
    phones: readArray(account.phones, 'account.phones').map(parsePhone),
    messengers: readArray(account.messengers, 'account.messengers').map(
      parseMessenger,
    ),
    createdAt: readString(account.created_at, 'account.created_at'),
  }
}

function parseEmployee(account: Record<string, unknown>): EmployeeAccount {
  return {
    id: readNumber(account.id, 'account.id'),
    companyId: readNumber(account.company_id, 'account.company_id'),
    name: readString(account.name, 'account.name'),
    position: readString(account.position, 'account.position'),
    login: readString(account.login, 'account.login'),
    isOnline: readBoolean(account.is_online, 'account.is_online'),
    lastSeenAt: readOptionalString(account.last_seen_at, 'account.last_seen_at'),
  }
}

function parseAdmin(account: Record<string, unknown>): AdminAccount {
  if (account.is_admin !== true) {
    throw new InvalidAuthSessionError('Administrator privileges are required')
  }

  const role = readRecord(account.role, 'account.role')

  return {
    id: readNumber(account.id, 'account.id'),
    name: readString(account.name, 'account.name'),
    email: readString(account.email, 'account.email'),
    phoneNumber: readOptionalString(account.phone_number, 'account.phone_number'),
    role: {
      id: readNumber(role.id, 'account.role.id'),
      name: readString(role.name, 'account.role.name'),
      label: readString(role.label, 'account.role.label'),
    },
    isAdmin: true,
    createdAt: readString(account.created_at, 'account.created_at'),
  }
}

function parsePhone(value: unknown): CompanyPhone {
  const phone = readRecord(value, 'account.phones[]')

  return {
    id: readNumber(phone.id, 'account.phones[].id'),
    phone: readString(phone.phone, 'account.phones[].phone'),
    label: readOptionalString(phone.label, 'account.phones[].label'),
  }
}

function parseMessenger(value: unknown): CompanyMessenger {
  const messenger = readRecord(value, 'account.messengers[]')

  return {
    id: readNumber(messenger.id, 'account.messengers[].id'),
    name: readString(messenger.name, 'account.messengers[].name'),
    contact: readString(messenger.contact, 'account.messengers[].contact'),
  }
}

function readRecord(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InvalidAuthSessionError(`${path} must be an object`)
  }

  return value as Record<string, unknown>
}

function readArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new InvalidAuthSessionError(`${path} must be an array`)
  }

  return value
}

function readString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw new InvalidAuthSessionError(`${path} must be a string`)
  }

  return value
}

function readOptionalString(value: unknown, path: string): string | undefined {
  return value === null || value === undefined ? undefined : readString(value, path)
}

function readNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new InvalidAuthSessionError(`${path} must be a number`)
  }

  return value
}

function readBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') {
    throw new InvalidAuthSessionError(`${path} must be a boolean`)
  }

  return value
}
