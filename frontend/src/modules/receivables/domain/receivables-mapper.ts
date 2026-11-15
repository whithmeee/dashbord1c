import type { MonthCloseCheckStatus } from '../../month-close/domain/month-close'
import type { ReceivablesCheck, ReceivablesDetails, ReceivablesIssue, ReceivablesSummary } from './receivables'

const statuses = ['ok', 'warning', 'critical'] as const

export function mapReceivablesSummary(value: unknown): ReceivablesSummary {
  const source = record(value, 'receivables')
  return {
    integrationId: integer(source.integration_id, 'receivables.integration_id'),
    month: text(source.month, 'receivables.month'),
    generatedAt: text(source.generated_at, 'receivables.generated_at'),
    shipped: money(source.shipped, 'receivables.shipped'),
    paid: money(source.paid, 'receivables.paid'),
    outstanding: money(source.outstanding, 'receivables.outstanding'),
    debtorsTotal: integer(source.debtors_total, 'receivables.debtors_total'),
    counterpartiesTotal: integer(source.counterparties_total, 'receivables.counterparties_total'),
    checks: list(source.checks, 'receivables.checks').map(mapCheck),
  }
}

export function mapReceivablesDetails(value: unknown): ReceivablesDetails {
  const source = record(value, 'receivablesDetails')
  return {
    check: text(source.check, 'receivablesDetails.check'),
    total: integer(source.total, 'receivablesDetails.total'),
    items: list(source.items, 'receivablesDetails.items').map(mapIssue),
  }
}

function mapCheck(value: unknown, index: number): ReceivablesCheck {
  const path = `receivables.checks.${index}`
  const source = record(value, path)
  return {
    key: text(source.key, `${path}.key`),
    label: text(source.label, `${path}.label`),
    count: integer(source.count, `${path}.count`),
    status: status(source.status, `${path}.status`),
  }
}

function mapIssue(value: unknown, index: number): ReceivablesIssue {
  const path = `receivablesDetails.items.${index}`
  const source = record(value, path)
  return {
    check: text(source.check, `${path}.check`),
    counterpartyKey: text(source.counterparty_key, `${path}.counterparty_key`),
    counterparty: text(source.counterparty, `${path}.counterparty`),
    shipped: money(source.shipped, `${path}.shipped`),
    paid: money(source.paid, `${path}.paid`),
    outstanding: money(source.outstanding, `${path}.outstanding`),
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

function integer(value: unknown, path: string): number {
  if (!Number.isInteger(value)) throw invalid(`${path} must be an integer`)
  return value as number
}

function money(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw invalid(`${path} must be a number`)
  return value
}

function status(value: unknown, path: string): MonthCloseCheckStatus {
  if (!statuses.includes(value as MonthCloseCheckStatus)) throw invalid(`${path} is unknown`)
  return value as MonthCloseCheckStatus
}

function invalid(message: string): Error {
  return new Error(`Invalid receivables response: ${message}`)
}
