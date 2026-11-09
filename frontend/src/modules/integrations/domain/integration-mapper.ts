import type { Integration, IntegrationCheck, IntegrationCheckStatus, IntegrationStatus } from './integration'

export class InvalidIntegrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidIntegrationError'
  }
}

export function mapIntegrations(value: unknown): readonly Integration[] {
  if (!Array.isArray(value)) {
    throw invalid('integrations must be an array')
  }

  return value.map((item) => mapIntegration(item))
}

export function mapIntegrationCheck(value: unknown): IntegrationCheck {
  const check = readRecord(value, 'integration check')
  const status = readString(check.status, 'integration check.status')

  if (!isIntegrationCheckStatus(status)) {
    throw invalid('integration check.status must be online, offline or inactive')
  }

  return {
    id: readNumber(check.id, 'integration check.id'),
    status,
    checkedAt: readString(check.checked_at, 'integration check.checked_at'),
  }
}

function mapIntegration(value: unknown): Integration {
  const integration = readRecord(value, 'integration')
  const status = readString(integration.status, 'integration.status')

  if (!isIntegrationStatus(status)) {
    throw invalid('integration.status must be active or inactive')
  }

  return {
    id: readNumber(integration.id, 'integration.id'),
    name: readString(integration.name, 'integration.name'),
    configName: readNullableString(integration.config_name, 'integration.config_name'),
    connectedAt: readNullableString(integration.connected_at ?? null, 'integration.connected_at'),
    isActive: readBoolean(integration.is_active, 'integration.is_active'),
    status,
  }
}

function readRecord(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(`${path} must be an object`)
  }

  return value as Record<string, unknown>
}

function readNullableString(value: unknown, path: string): string | null {
  return value === null ? null : readString(value, path)
}

function readString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw invalid(`${path} must be a string`)
  }

  return value
}

function readNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw invalid(`${path} must be an integer`)
  }

  return value
}

function readBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') {
    throw invalid(`${path} must be a boolean`)
  }

  return value
}

function isIntegrationStatus(value: string): value is IntegrationStatus {
  return value === 'active' || value === 'inactive'
}

function isIntegrationCheckStatus(value: string): value is IntegrationCheckStatus {
  return value === 'online' || value === 'offline' || value === 'inactive'
}

function invalid(message: string): InvalidIntegrationError {
  return new InvalidIntegrationError(message)
}
