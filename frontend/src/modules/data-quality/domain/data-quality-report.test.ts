import { describe, expect, it } from 'vitest'
import type { DataQualityIssue, DataQualityReport } from './data-quality'
import { withoutResolvedIssues } from './data-quality-report'

const issue = (objectId: string, rule: string, severity: DataQualityIssue['severity']): DataQualityIssue => ({
  id: `${rule}:${objectId}`,
  rule,
  severity,
  category: 'tax_details',
  entity: 'Catalog_Контрагенты',
  objectId,
  title: objectId,
  message: 'Проблема',
  fields: {},
})

const report: DataQualityReport = {
  summary: {
    integrationId: 1,
    checkedAt: '2026-11-18T10:00:00Z',
    totals: { critical: 2, warning: 1, info: 0, checkedObjects: 9, issues: 3 },
    capabilities: { taxDetails: true, innValidation: true, kppValidation: true, legalType: true, contracts: true },
  },
  issues: [issue('a', 'missing_inn', 'critical'), issue('a', 'missing_kpp', 'warning'), issue('b', 'missing_inn', 'critical')],
}

describe('withoutResolvedIssues', () => {
  it('removes the resolved rules of one object only and recounts the totals', () => {
    const next = withoutResolvedIssues(report, 'a', ['missing_inn', 'invalid_inn'])

    expect(next.issues.map((entry) => entry.id)).toEqual(['missing_kpp:a', 'missing_inn:b'])
    expect(next.summary.totals).toEqual({ critical: 1, warning: 1, info: 0, checkedObjects: 9, issues: 2 })
  })

  it('leaves the report untouched when nothing matches', () => {
    expect(withoutResolvedIssues(report, 'zzz', ['missing_inn']).issues).toEqual(report.issues)
  })
})
