import { describe, expect, it } from 'vitest'
import { mapDataQualityIssues, mapDataQualitySummary } from './data-quality-mapper'

describe('data quality mappers', () => {
  it('maps summary and capabilities', () => {
    expect(mapDataQualitySummary({
      integration_id: 4,
      checked_at: '2026-11-12T10:00:00Z',
      totals: { critical: 2, warning: 3, info: 0, checked_objects: 20, issues: 5 },
      capabilities: { tax_details: true, inn_validation: true, kpp_validation: true, legal_type: true, contracts: false },
    })).toEqual({
      integrationId: 4,
      checkedAt: '2026-11-12T10:00:00Z',
      totals: { critical: 2, warning: 3, info: 0, checkedObjects: 20, issues: 5 },
      capabilities: { taxDetails: true, innValidation: true, kppValidation: true, legalType: true, contracts: false },
    })
  })

  it('maps issues without inventing sensitive fields', () => {
    expect(mapDataQualityIssues({
      integration_id: 4,
      checked_at: '2026-11-12T10:00:00Z',
      items: [{
        id: 'missing_inn:c1',
        rule: 'missing_inn',
        severity: 'critical',
        category: 'tax_details',
        entity: 'Catalog_Контрагенты',
        object_id: 'c1',
        title: 'Альфа',
        message: 'Не указан ИНН.',
        fields: {},
      }],
    }).items[0]).toEqual({
      id: 'missing_inn:c1',
      rule: 'missing_inn',
      severity: 'critical',
      category: 'tax_details',
      entity: 'Catalog_Контрагенты',
      objectId: 'c1',
      title: 'Альфа',
      message: 'Не указан ИНН.',
      fields: {},
    })
  })

  it('rejects an unknown severity', () => {
    expect(() => mapDataQualityIssues({ integration_id: 1, checked_at: 'now', items: [{
      id: 'x', rule: 'x', severity: 'urgent', category: 'tax_details', entity: 'x', object_id: 'x', title: 'x', message: 'x', fields: {},
    }] })).toThrow('severity')
  })
})
