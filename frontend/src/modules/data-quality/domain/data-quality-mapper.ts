import {
  dataQualityCategories,
  dataQualitySeverities,
  type DataQualityCapabilities,
  type DataQualityCategory,
  type DataQualityIssue,
  type DataQualitySeverity,
  type DataQualitySummary,
} from './data-quality'

export function mapDataQualitySummary(value: unknown): DataQualitySummary {
  const summary = record(value, 'summary')
  const totals = record(summary.totals, 'summary.totals')
  const capabilities = record(summary.capabilities, 'summary.capabilities')

  return {
    integrationId: integer(summary.integration_id, 'summary.integration_id'),
    checkedAt: text(summary.checked_at, 'summary.checked_at'),
    totals: {
      critical: integer(totals.critical, 'summary.totals.critical'),
      warning: integer(totals.warning, 'summary.totals.warning'),
      info: integer(totals.info, 'summary.totals.info'),
      checkedObjects: integer(totals.checked_objects, 'summary.totals.checked_objects'),
      issues: integer(totals.issues, 'summary.totals.issues'),
    },
    capabilities: mapCapabilities(capabilities),
  }
}

export function mapDataQualityIssues(value: unknown): { readonly items: readonly DataQualityIssue[] } {
  const response = record(value, 'issues')
  if (!Array.isArray(response.items)) {
    throw invalid('issues.items must be an array')
  }

  return { items: response.items.map(mapIssue) }
}

function mapCapabilities(value: Record<string, unknown>): DataQualityCapabilities {
  return {
    taxDetails: boolean(value.tax_details, 'summary.capabilities.tax_details'),
    innValidation: boolean(value.inn_validation, 'summary.capabilities.inn_validation'),
    kppValidation: boolean(value.kpp_validation, 'summary.capabilities.kpp_validation'),
    legalType: boolean(value.legal_type, 'summary.capabilities.legal_type'),
    contracts: boolean(value.contracts, 'summary.capabilities.contracts'),
  }
}

function mapIssue(value: unknown): DataQualityIssue {
  const issue = record(value, 'issue')
  const severity = text(issue.severity, 'issue.severity')
  const category = text(issue.category, 'issue.category')

  if (!dataQualitySeverities.includes(severity as DataQualitySeverity)) {
    throw invalid('issue.severity is unknown')
  }
  if (!dataQualityCategories.includes(category as DataQualityCategory)) {
    throw invalid('issue.category is unknown')
  }

  return {
    id: text(issue.id, 'issue.id'),
    rule: text(issue.rule, 'issue.rule'),
    severity: severity as DataQualitySeverity,
    category: category as DataQualityCategory,
    entity: text(issue.entity, 'issue.entity'),
    objectId: text(issue.object_id, 'issue.object_id'),
    title: text(issue.title, 'issue.title'),
    message: text(issue.message, 'issue.message'),
    fields: stringRecord(issue.fields, 'issue.fields'),
  }
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(`${path} must be an object`)
  }
  return value as Record<string, unknown>
}

function stringRecord(value: unknown, path: string): Readonly<Record<string, string>> {
  const source = record(value, path)
  if (Object.values(source).some((item) => typeof item !== 'string')) {
    throw invalid(`${path} must contain strings`)
  }
  return source as Record<string, string>
}

function text(value: unknown, path: string): string {
  if (typeof value !== 'string') throw invalid(`${path} must be a string`)
  return value
}

function integer(value: unknown, path: string): number {
  if (!Number.isInteger(value)) throw invalid(`${path} must be an integer`)
  return value as number
}

function boolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') throw invalid(`${path} must be a boolean`)
  return value
}

function invalid(message: string): Error {
  return new Error(`Invalid data quality response: ${message}`)
}
