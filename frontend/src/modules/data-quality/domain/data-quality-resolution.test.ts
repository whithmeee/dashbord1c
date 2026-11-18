import { describe, expect, it } from 'vitest'
import type { DataQualityIssue } from './data-quality'
import { resolutionOf, resolvedRules } from './data-quality-resolution'

const issue = (rule: string, fields: Record<string, string> = {}): DataQualityIssue => ({
  id: `${rule}:c1`,
  rule,
  severity: 'warning',
  category: 'tax_details',
  entity: 'Catalog_Контрагенты',
  objectId: 'c1',
  title: 'Альфа',
  message: 'Проблема',
  fields,
})

describe('data quality resolution', () => {
  it('lets the person type the missing or wrong INN', () => {
    expect(resolutionOf(issue('missing_inn'))).toEqual({ kind: 'edit', field: 'inn', suggestIndividual: false })
    expect(resolutionOf(issue('invalid_inn'))).toEqual({ kind: 'edit', field: 'inn', suggestIndividual: false })
  })

  it('lets the person type the KPP and suggests the entrepreneur type for a twelve digit INN', () => {
    expect(resolutionOf(issue('missing_kpp', { inn: '7707083893' }))).toEqual({ kind: 'edit', field: 'kpp', suggestIndividual: false })
    expect(resolutionOf(issue('invalid_kpp', { inn: '500100732259' }))).toEqual({ kind: 'edit', field: 'kpp', suggestIndividual: true })
  })

  it('sends the person to 1C for the problems that cannot be fixed here', () => {
    expect(resolutionOf(issue('missing_contract'))).toMatchObject({ kind: 'advice', advice: expect.stringContaining('«Договоры»') })
    expect(resolutionOf(issue('duplicate_inn'))).toMatchObject({ kind: 'advice', advice: expect.stringContaining('Поиск и удаление дублей') })
    expect(resolutionOf(issue('something_new'))).toMatchObject({ kind: 'advice' })
  })

  it('knows which issues a change resolves', () => {
    expect(resolvedRules({ inn: '7707083893' })).toEqual(['missing_inn', 'invalid_inn'])
    expect(resolvedRules({ kpp: '770701001' })).toEqual(['missing_kpp', 'invalid_kpp'])
    expect(resolvedRules({ legalType: 'individual' })).toEqual(['missing_kpp', 'invalid_kpp'])
  })
})
