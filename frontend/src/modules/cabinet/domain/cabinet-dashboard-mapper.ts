import type {
  CabinetCompany,
  CabinetDashboard,
  CabinetEmployee,
  CabinetIntegration,
  CabinetMessenger,
  CabinetPhone,
} from './cabinet'

export class InvalidCabinetDashboardError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidCabinetDashboardError'
  }
}

export function mapCabinetDashboard(value: unknown): CabinetDashboard {
  const payload = readRecord(value, 'dashboard')
  const company = mapCompany(readRecord(payload.company, 'company'))
  const integrations = mapIntegrations(readRecord(payload.integrations, 'integrations'))
  const employees = payload.employees === undefined
    ? undefined
    : mapEmployees(readRecord(payload.employees, 'employees'))

  return { company, integrations, ...(employees ? { employees } : {}) }
}

function mapCompany(value: Record<string, unknown>): CabinetCompany {
  const status = readString(value.subscription_status, 'company.subscription_status')
  if (status !== 'active' && status !== 'inactive') {
    throw invalid('company.subscription_status must be active or inactive')
  }

  return {
    id: readNumber(value.id, 'company.id'),
    name: readString(value.name, 'company.name'),
    email: readString(value.email, 'company.email'),
    emailVerified: readBoolean(value.email_verified, 'company.email_verified'),
    subscriptionStatus: status,
    phones: readArray(value.phones, 'company.phones').map(mapPhone),
    messengers: readArray(value.messengers, 'company.messengers').map(mapMessenger),
    createdAt: readString(value.created_at, 'company.created_at'),
  }
}

function mapIntegrations(value: Record<string, unknown>): CabinetDashboard['integrations'] {
  return {
    count: readNumber(value.count, 'integrations.count'),
    activeCount: readNumber(value.active_count, 'integrations.active_count'),
    items: readArray(value.items, 'integrations.items').map(mapIntegration),
  }
}

function mapIntegration(value: unknown): CabinetIntegration {
  const integration = readRecord(value, 'integrations.items[]')
  const status = readString(integration.status, 'integrations.items[].status')
  if (status !== 'active' && status !== 'inactive') {
    throw invalid('integrations.items[].status must be active or inactive')
  }

  return {
    id: readNumber(integration.id, 'integrations.items[].id'),
    companyId: readNumber(integration.company_id, 'integrations.items[].company_id'),
    name: readString(integration.name, 'integrations.items[].name'),
    odataUrl: readString(integration.odata_url, 'integrations.items[].odata_url'),
    login: readString(integration.login, 'integrations.items[].login'),
    configName: readString(integration.config_name, 'integrations.items[].config_name'),
    isActive: readBoolean(integration.is_active, 'integrations.items[].is_active'),
    status,
  }
}

function mapEmployees(value: Record<string, unknown>): NonNullable<CabinetDashboard['employees']> {
  return {
    count: readNumber(value.count, 'employees.count'),
    onlineCount: readNumber(value.online_count, 'employees.online_count'),
    items: readArray(value.items, 'employees.items').map(mapEmployee),
  }
}

function mapEmployee(value: unknown): CabinetEmployee {
  const employee = readRecord(value, 'employees.items[]')
  return {
    id: readNumber(employee.id, 'employees.items[].id'),
    companyId: readNumber(employee.company_id, 'employees.items[].company_id'),
    name: readString(employee.name, 'employees.items[].name'),
    position: readString(employee.position, 'employees.items[].position'),
    login: readString(employee.login, 'employees.items[].login'),
    isOnline: readBoolean(employee.is_online, 'employees.items[].is_online'),
    lastSeenAt: readNullableString(employee.last_seen_at, 'employees.items[].last_seen_at'),
  }
}

function mapPhone(value: unknown): CabinetPhone {
  const phone = readRecord(value, 'company.phones[]')
  return {
    id: readNumber(phone.id, 'company.phones[].id'),
    phone: readString(phone.phone, 'company.phones[].phone'),
    label: readNullableString(phone.label, 'company.phones[].label'),
  }
}

function mapMessenger(value: unknown): CabinetMessenger {
  const messenger = readRecord(value, 'company.messengers[]')
  return {
    id: readNumber(messenger.id, 'company.messengers[].id'),
    name: readString(messenger.name, 'company.messengers[].name'),
    contact: readString(messenger.contact, 'company.messengers[].contact'),
  }
}

function readRecord(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(`${path} must be an object`)
  }
  return value as Record<string, unknown>
}

function readArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw invalid(`${path} must be an array`)
  }
  return value
}

function readString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw invalid(`${path} must be a string`)
  }
  return value
}

function readNullableString(value: unknown, path: string): string | null {
  return value === null ? null : readString(value, path)
}

function readNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw invalid(`${path} must be a number`)
  }
  return value
}

function readBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') {
    throw invalid(`${path} must be a boolean`)
  }
  return value
}

function invalid(message: string): InvalidCabinetDashboardError {
  return new InvalidCabinetDashboardError(message)
}
