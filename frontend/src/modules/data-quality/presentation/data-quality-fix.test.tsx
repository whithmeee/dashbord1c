import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { DataQualityIssue } from '../domain/data-quality'
import { DataQualityFixForm } from './data-quality-fix-form'
import { DataQualityHint } from './data-quality-hint'
import { DataQualityIssueDialog } from './data-quality-issue-dialog'

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

const noFix = () => Promise.resolve()

describe('data quality fix', () => {
  it('shows an input with the current value and the 1C write note', () => {
    const html = renderToStaticMarkup(<DataQualityFixForm issue={issue('invalid_inn', { inn: '123' })} resolution={{ field: 'inn', suggestIndividual: false }} onFix={noFix} />)

    expect(html).toContain('value="123"')
    expect(html).toContain('10 цифр для организации')
    expect(html).toContain('Сохранить в 1С')
    expect(html).not.toContain('сменить тип на ИП')
  })

  it('offers the entrepreneur type for a KPP problem of a twelve digit INN', () => {
    const html = renderToStaticMarkup(<DataQualityFixForm issue={issue('missing_kpp', { inn: '500100732259' })} resolution={{ field: 'kpp', suggestIndividual: true }} onFix={noFix} />)

    expect(html).toContain('ИНН из 12 цифр: сменить тип на ИП')
  })

  it('shows the fix form for a fixable issue and the recommendation for the others', () => {
    const fixable = renderToStaticMarkup(<DataQualityIssueDialog issue={issue('missing_inn')} onClose={() => undefined} onFix={noFix} />)
    const advice = renderToStaticMarkup(<DataQualityIssueDialog issue={issue('missing_contract')} onClose={() => undefined} onFix={noFix} />)

    expect(fixable).toContain('data-quality-fix-form')
    expect(advice).toContain('data-quality-advice')
    expect(advice).toContain('«Договоры»')
    expect(advice).not.toContain('data-quality-fix-form')
  })

  it('renders a question mark button that explains what to do in 1C', () => {
    const html = renderToStaticMarkup(<DataQualityHint advice="Создайте договор в 1С." />)

    expect(html).toContain('aria-label="Что нужно сделать в 1С"')
  })
})
