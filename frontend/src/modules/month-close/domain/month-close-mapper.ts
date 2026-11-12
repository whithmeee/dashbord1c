import type { MonthCloseCheck, MonthCloseCheckStatus, MonthCloseDetails, MonthCloseIssue, MonthCloseSummary } from './month-close'

const statuses = ['ok', 'warning', 'critical'] as const

export function mapMonthCloseSummary(value: unknown): MonthCloseSummary {
  const source = record(value, 'monthClose')
  return {
    integrationId: integer(source.integration_id, 'monthClose.integration_id'),
    month: text(source.month, 'monthClose.month'),
    generatedAt: text(source.generated_at, 'monthClose.generated_at'),
    documentsTotal: integer(source.documents_total, 'monthClose.documents_total'),
    documentsFlagged: integer(source.documents_flagged, 'monthClose.documents_flagged'),
    readiness: integer(source.readiness, 'monthClose.readiness'),
    checks: list(source.checks, 'monthClose.checks').map(mapCheck),
  }
}

export function mapMonthCloseDetails(value: unknown): MonthCloseDetails {
  const source = record(value, 'monthCloseDetails')
  return {
    check: text(source.check, 'monthCloseDetails.check'),
    total: integer(source.total, 'monthCloseDetails.total'),
    items: list(source.items, 'monthCloseDetails.items').map(mapIssue),
  }
}

function mapCheck(value: unknown, index: number): MonthCloseCheck {
  const path = `monthClose.checks.${index}`
  const source = record(value, path)
  return {
    key: text(source.key, `${path}.key`),
    label: text(source.label, `${path}.label`),
    count: integer(source.count, `${path}.count`),
    status: status(source.status, `${path}.status`),
  }
}

function mapIssue(value: unknown, index: number): MonthCloseIssue {
  const path = `monthCloseDetails.items.${index}`
  const source = record(value, path)
  return {
    check: text(source.check, `${path}.check`),
    entity: text(source.entity, `${path}.entity`),
    entityLabel: text(source.entity_label, `${path}.entity_label`),
    refKey: text(source.ref_key, `${path}.ref_key`),
    number: nullableText(source.number, `${path}.number`),
    date: nullableText(source.date, `${path}.date`),
    amount: nullableNumber(source.amount, `${path}.amount`),
    message: text(source.message, `${path}.message`),
  }
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${path} must be an object`)
  return value as Record<string, unknown>
}

function list(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) throw invalid(`${path} must be an array`)
  return value
}

function text(value: unknown, path: string): string {
  if (typeof value !== 'string') throw invalid(`${path} must be a string`)
  return value
}

function nullableText(value: unknown, path: string): string | null {
  return value === null ? null : text(value, path)
}

function integer(value: unknown, path: string): number {
  if (!Number.isInteger(value)) throw invalid(`${path} must be an integer`)
  return value as number
}

function nullableNumber(value: unknown, path: string): number | null {
  if (value === null) return null
  if (typeof value !== 'number' || !Number.isFinite(value)) throw invalid(`${path} must be a number`)
  return value
}

function status(value: unknown, path: string): MonthCloseCheckStatus {
  if (!statuses.includes(value as MonthCloseCheckStatus)) throw invalid(`${path} is unknown`)
  return value as MonthCloseCheckStatus
}

function invalid(message: string): Error {
  return new Error(`Invalid month close response: ${message}`)
}
