import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { mapDocumentDraft } from '../domain/document-draft-mapper'
import { draftResponse } from '../testing/document-draft-fixture'
import { DocumentEditor } from './document-editor'

describe('document editor calendar', () => {
  it('renders the document date picker and save button', () => {
    const draft = mapDocumentDraft(draftResponse)
    const html = renderToStaticMarkup(
      <DocumentEditor data={draft.data} disabled={false} onSave={() => undefined} />,
    )

    expect(html).toContain('Дата документа')
    expect(html).toContain('10.11.2026')
    expect(html).toContain('Сохранить и проверить')
    expect(html).not.toContain('type="date"')
  })
})

describe('document editor units', () => {
  it('renders a unit select for every item and the unit written in the document when it differs', () => {
    const draft = mapDocumentDraft({
      ...draftResponse,
      data: {
        ...draftResponse.data,
        units: [{ key: 'unit-l', name: 'л' }],
        unit_mode: 'edit',
        items: [{ ...draftResponse.data.items[0], unit: 'шт.', unit_key: 'unit-l', unit_name: 'л', catalog_unit_key: 'unit-l' }],
      },
    })
    const html = renderToStaticMarkup(<DocumentEditor data={draft.data} disabled={false} onSave={() => undefined} />)

    expect(html).toContain('Единица измерения, позиция 1')
    expect(html).toContain('В УПД: шт.')
  })
})

describe('document editor units in a base that does not allow choosing', () => {
  it('shows the unit of the card as text without a select', () => {
    const draft = mapDocumentDraft({
      ...draftResponse,
      data: {
        ...draftResponse.data,
        unit_mode: 'view',
        items: [{ ...draftResponse.data.items[0], unit: 'шт.', unit_key: 'unit-l', unit_name: 'л', catalog_unit_key: 'unit-l' }],
      },
    })
    const html = renderToStaticMarkup(<DocumentEditor data={draft.data} disabled={false} onSave={() => undefined} />)

    expect(html).toContain('<output')
    expect(html).toContain('>л</output>')
    expect(html).toContain('В УПД: шт.')
    expect(html).not.toContain('role="combobox"')
  })
})
