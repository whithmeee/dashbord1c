import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { mapDocumentDraft } from '../domain/document-draft-mapper'
import { draftResponse } from '../testing/document-draft-fixture'
import { canCreateCounterparty } from '../domain/counterparty-rules'
import { CounterpartyDialog } from './counterparty-dialog'

const supplier = mapDocumentDraft(draftResponse).data.counterparty
const missing = { ...supplier, refKey: null, catalogName: null, match: 'missing' as const }

describe('counterparty dialog', () => {
  it('shows what will be created in the 1C catalog', () => {
    const html = renderToStaticMarkup(<CounterpartyDialog open party={missing} busy={false} onCreate={() => undefined} onClose={() => undefined} />)

    expect(html).toContain('Создать контрагента в 1С')
    expect(html).toContain('ООО Ромашка')
    expect(html).toContain('7701234567')
    expect(html).toContain('Юридическое лицо')
    expect(html).toContain('Создать в 1С')
  })

  it('treats a twelve digit INN as an individual entrepreneur', () => {
    const html = renderToStaticMarkup(<CounterpartyDialog open party={{ ...missing, inn: '770123456789' }} busy={false} onCreate={() => undefined} onClose={() => undefined} />)

    expect(html).toContain('Индивидуальный предприниматель')
  })

  it('allows creation only for a missing supplier with a name and a valid INN', () => {
    expect(canCreateCounterparty(missing)).toBe(true)
    expect(canCreateCounterparty(supplier)).toBe(false)
    expect(canCreateCounterparty({ ...missing, inn: '123' })).toBe(false)
    expect(canCreateCounterparty({ ...missing, name: '' })).toBe(false)
  })
})
