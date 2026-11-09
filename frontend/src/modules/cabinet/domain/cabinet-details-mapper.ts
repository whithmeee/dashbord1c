import type { CabinetStatistics, CabinetSubscription, CabinetSystemStatus } from './cabinet-details'

export class InvalidCabinetDetailsError extends Error {
  constructor(message: string) { super(message); this.name = 'InvalidCabinetDetailsError' }
}

export function mapCabinetSystemStatus(value: unknown): CabinetSystemStatus {
  const record = object(value, 'system status')
  const status = string(record.status, 'status')
  if (!['operational', 'degraded', 'inactive'].includes(status)) throw invalid('status is invalid')
  return {
    status: status as CabinetSystemStatus['status'], message: string(record.message, 'message'),
    total: integer(record.total, 'total'), activeCount: integer(record.active_count, 'active_count'),
    inactiveCount: integer(record.inactive_count, 'inactive_count'),
    integrations: array(record.integrations, 'integrations').map((item) => {
      const integration = object(item, 'integrations[]')
      const state = string(integration.status, 'integrations[].status')
      if (state !== 'active' && state !== 'inactive') throw invalid('integration status is invalid')
      const reason = integration.reason
      if (reason !== null && reason !== 'disabled' && reason !== 'unreachable') throw invalid('integration reason is invalid')
      return { id: integer(integration.id, 'integrations[].id'), name: string(integration.name, 'integrations[].name'), status: state, reason, checkedAt: nullableString(integration.checked_at, 'integrations[].checked_at') }
    }),
  }
}

export function mapCabinetSubscription(value: unknown): CabinetSubscription {
  const record = object(value, 'subscription')
  const status = string(record.status, 'status'); const state = string(record.state, 'state')
  if (status !== 'active' && status !== 'inactive') throw invalid('subscription status is invalid')
  if (!['active', 'expired', 'not_started'].includes(state)) throw invalid('subscription state is invalid')
  return { status, state: state as CabinetSubscription['state'], startsAt: string(record.starts_at, 'starts_at'), endsAt: string(record.ends_at, 'ends_at'), totalDays: integer(record.total_days, 'total_days'), elapsedDays: integer(record.elapsed_days, 'elapsed_days'), daysLeft: integer(record.days_left, 'days_left'), progressPercent: integer(record.progress_percent, 'progress_percent'), expiresSoon: boolean(record.expires_soon, 'expires_soon') }
}

export function mapCabinetStatistics(value: unknown): CabinetStatistics {
  const record = object(value, 'statistics'); const period = object(record.period, 'period'); const summary = object(record.summary, 'summary')
  const peak = summary.peak_day === null ? null : object(summary.peak_day, 'summary.peak_day')
  return {
    period: { from: string(period.from, 'period.from'), to: string(period.to, 'period.to'), group: string(period.group, 'period.group') }, total: integer(record.total, 'total'),
    summary: { averagePerDay: number(summary.average_per_day, 'summary.average_per_day'), activeDays: integer(summary.active_days, 'summary.active_days'), peakDay: peak ? { date: string(peak.date, 'summary.peak_day.date'), requests: integer(peak.requests, 'summary.peak_day.requests') } : null, lastRequestAt: nullableString(summary.last_request_at, 'summary.last_request_at') },
    byPeriod: array(record.by_period, 'by_period').map((item) => mapPeriod(item)),
    byIntegration: array(record.by_integration, 'by_integration').map((item) => { const row = object(item, 'by_integration[]'); return { integrationId: integer(row.integration_id, 'by_integration[].integration_id'), name: string(row.name, 'by_integration[].name'), requests: integer(row.requests, 'by_integration[].requests') } }),
    byAuthor: array(record.by_author ?? [], 'by_author').map((item) => { const row = object(item, 'by_author[]'); return { type: string(row.type, 'by_author[].type'), id: integer(row.id, 'by_author[].id'), name: string(row.name, 'by_author[].name'), requests: integer(row.requests, 'by_author[].requests') } }),
  }
}

function mapPeriod(value: unknown) { const row = object(value, 'by_period[]'); return { period: string(row.period, 'by_period[].period'), requests: integer(row.requests, 'by_period[].requests') } }
function object(value: unknown, path: string): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${path} must be an object`); return value as Record<string, unknown> }
function array(value: unknown, path: string): unknown[] { if (!Array.isArray(value)) throw invalid(`${path} must be an array`); return value }
function string(value: unknown, path: string): string { if (typeof value !== 'string') throw invalid(`${path} must be a string`); return value }
function nullableString(value: unknown, path: string): string | null { return value === null ? null : string(value, path) }
function integer(value: unknown, path: string): number { if (typeof value !== 'number' || !Number.isInteger(value)) throw invalid(`${path} must be an integer`); return value }
function number(value: unknown, path: string): number { if (typeof value !== 'number' || !Number.isFinite(value)) throw invalid(`${path} must be a number`); return value }
function boolean(value: unknown, path: string): boolean { if (typeof value !== 'boolean') throw invalid(`${path} must be boolean`); return value }
function invalid(message: string): InvalidCabinetDetailsError { return new InvalidCabinetDetailsError(message) }
