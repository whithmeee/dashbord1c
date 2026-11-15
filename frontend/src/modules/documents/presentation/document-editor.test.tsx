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
