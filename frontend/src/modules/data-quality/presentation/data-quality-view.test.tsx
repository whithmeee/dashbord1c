import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { filterDataQualityIssues } from './data-quality-filter'
import { DataQualityReportView } from './data-quality-report-view'
import type { DataQualityReport } from '../domain/data-quality'

const report: DataQualityReport = {
  summary: {
    integrationId: 1,
    checkedAt: '2026-11-12T10:00:00Z',
    totals: { critical: 1, warning: 1, info: 0, checkedObjects: 10, issues: 2 },
    capabilities: { taxDetails: true, innValidation: true, kppValidation: true, legalType: true, contracts: true },
  },
  issues: [
    { id: 'a', rule: 'missing_inn', severity: 'critical', category: 'tax_details', entity: 'Catalog', objectId: '1', title: 'Альфа', message: 'Нет ИНН', fields: {} },
    { id: 'b', rule: 'missing_contract', severity: 'warning', category: 'contracts', entity: 'Catalog', objectId: '2', title: 'Бета', message: 'Нет договора', fields: {} },
  ],
}

describe('data quality report view', () => {
  it('renders summary, filters and concrete issues', () => {
    const html = renderToStaticMarkup(<DataQualityReportView report={report} integrations={[{ id: 1, name: 'База 1С' }]} selectedIntegrationId={1} onSelect={() => undefined} onRefresh={() => undefined} />)

    expect(html).toContain('Критические')
    expect(html).toContain('Проверено объектов')
    expect(html).toContain('Альфа')
    expect(html).toContain('Нет ИНН')
    expect(html).toContain('Все категории')
    expect(html.match(/role="combobox"/g)).toHaveLength(3)
  })

  it('filters issues by severity and category', () => {
    expect(filterDataQualityIssues(report.issues, 'warning', 'contracts')).toEqual([report.issues[1]])
    expect(filterDataQualityIssues(report.issues, 'all', 'all')).toEqual(report.issues)
  })
})
