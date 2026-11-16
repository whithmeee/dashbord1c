import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { mapDocumentDraft } from '../domain/document-draft-mapper'
import { draftResponse } from '../testing/document-draft-fixture'
import { DocumentPreview } from './document-preview'

describe('document preview', () => {
  it('shows the document header, parties, items and total as they will go to 1C', () => {
    const html = renderToStaticMarkup(<DocumentPreview data={mapDocumentDraft(draftResponse).data} />)

    expect(html).toContain('№ 418 от 10.11.2026')
    expect(html).toContain('ООО Ромашка')
    expect(html).toContain('ИНН 7701234567')
    expect(html).toContain('«Ромашка»')
    expect(html).toContain('Болт М8')
    expect(html).toMatch(/1\s000 ₽/)
    expect(html).toContain('Итого с НДС')
    expect(html).toContain('непроведённым')
  })

  it('marks items missing in 1C and hides the items table for an invoice', () => {
    const missing = mapDocumentDraft({
      ...draftResponse,
      data: { ...draftResponse.data, items: [{ ...draftResponse.data.items[0], ref_key: null, match: 'missing' }] },
    })
    const invoice = mapDocumentDraft({ ...draftResponse, data: { ...draftResponse.data, type: 'invoice' } })

    expect(renderToStaticMarkup(<DocumentPreview data={missing.data} />)).toContain('Нет в 1С')
    expect(renderToStaticMarkup(<DocumentPreview data={invoice.data} />)).not.toContain('Позиции документа')
  })
})
