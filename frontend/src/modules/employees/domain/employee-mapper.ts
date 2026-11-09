import { employeeSections, type Employee, type EmployeeSection } from './employee'

export class InvalidEmployeeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidEmployeeError'
  }
}

export function mapEmployees(value: unknown): readonly Employee[] {
  if (!Array.isArray(value)) {
    throw invalid('employees must be an array')
  }

  return value.map((item) => mapEmployee(item))
}

export function mapEmployee(value: unknown): Employee {
  const employee = readRecord(value, 'employee')

  return {
    id: readInteger(employee.id, 'employee.id'),
    companyId: readInteger(employee.company_id, 'employee.company_id'),
    name: readString(employee.name, 'employee.name'),
    position: readString(employee.position, 'employee.position'),
    login: readString(employee.login, 'employee.login'),
    sections: readSections(employee.sections),
    isOnline: readBoolean(employee.is_online, 'employee.is_online'),
    lastSeenAt: readNullableString(employee.last_seen_at, 'employee.last_seen_at'),
    createdAt: readNullableString(employee.created_at ?? null, 'employee.created_at'),
  }
}

function readRecord(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(`${path} must be an object`)
  }

  return value as Record<string, unknown>
}

function readString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw invalid(`${path} must be a string`)
  }

  return value
}

function readNullableString(value: unknown, path: string): string | null {
  if (value !== null && typeof value !== 'string') {
    throw invalid(`${path} must be a string or null`)
  }

  return value
}

function readInteger(value: unknown, path: string): number {
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

function readSections(value: unknown): readonly EmployeeSection[] {
  if (value === undefined) return [...employeeSections]
  if (!Array.isArray(value) || value.some((item) => !employeeSections.includes(item as EmployeeSection))) {
    throw invalid('employee.sections must contain known sections')
  }
  return value as EmployeeSection[]
}

function invalid(message: string): InvalidEmployeeError {
  return new InvalidEmployeeError(message)
}
