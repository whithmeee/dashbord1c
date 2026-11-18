import type { DataQualityIssue, DataQualityReport } from './data-quality'

export function withoutResolvedIssues(report: DataQualityReport, objectId: string, rules: readonly string[]): DataQualityReport {
  const isResolved = (issue: DataQualityIssue) => issue.objectId === objectId && rules.includes(issue.rule)
  const issues = report.issues.filter((issue) => !isResolved(issue))
  const count = (severity: DataQualityIssue['severity']) => issues.filter((issue) => issue.severity === severity).length

  return {
    summary: {
      ...report.summary,
      totals: {
        ...report.summary.totals,
        critical: count('critical'),
        warning: count('warning'),
        info: count('info'),
        issues: issues.length,
      },
    },
    issues,
  }
}
