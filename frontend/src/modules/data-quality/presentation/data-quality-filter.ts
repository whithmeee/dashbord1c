import type { DataQualityCategory, DataQualityIssue, DataQualitySeverity } from '../domain/data-quality'

export type SeverityFilter = DataQualitySeverity | 'all'
export type CategoryFilter = DataQualityCategory | 'all'

export function filterDataQualityIssues(
  issues: readonly DataQualityIssue[],
  severity: SeverityFilter,
  category: CategoryFilter,
): readonly DataQualityIssue[] {
  return issues.filter((issue) =>
    (severity === 'all' || issue.severity === severity)
    && (category === 'all' || issue.category === category))
}
