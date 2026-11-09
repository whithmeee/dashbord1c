import type { EmployeeActivityItem, EmployeeActivityItemType, EmployeeActivityProfile } from './employee-activity'

export class InvalidEmployeeActivityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidEmployeeActivityError'
  }
}

export function mapEmployeeActivity(value: unknown): EmployeeActivityProfile {
  const profile = record(value, 'employee activity')
  const items = profile.items

  if (!Array.isArray(items)) throw invalid('employee activity.items must be an array')

  return {
    lastLoginAt: nullableString(profile.last_login_at, 'last_login_at'),
    lastLogoutAt: nullableString(profile.last_logout_at, 'last_logout_at'),
    questionsCount: integer(profile.questions_count, 'questions_count'),
    items: items.map((item) => mapItem(item)),
  }
}

function mapItem(value: unknown): EmployeeActivityItem {
  const item = record(value, 'employee activity item')
  const type = item.type

  if (type !== 'login' && type !== 'logout' && type !== 'question') {
    throw invalid('employee activity item.type is invalid')
  }

  return {
    type: type as EmployeeActivityItemType,
    at: string(item.at, 'item.at'),
    details: nullableString(item.details, 'item.details'),
  }
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${path} must be an object`)
  return value as Record<string, unknown>
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string') throw invalid(`${path} must be a string`)
  return value
}

function nullableString(value: unknown, path: string): string | null {
  if (value !== null && typeof value !== 'string') throw invalid(`${path} must be a string or null`)
  return value
}

function integer(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) throw invalid(`${path} must be an integer`)
  return value
}

function invalid(message: string): InvalidEmployeeActivityError {
  return new InvalidEmployeeActivityError(message)
}
