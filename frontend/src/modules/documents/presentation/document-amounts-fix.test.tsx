import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { mapDocumentDraft } from '../domain/document-draft-mapper'
import { draftResponse } from '../testing/document-draft-fixture'
import { DocumentAmountsFix } from './document-amounts-fix'
import { DocumentEditor } from './document-editor'

const data = mapDocumentDraft(draftResponse).data

describe('document amounts fix', () => {
  it('explains the mismatch and offers both ways to fix it', () => {
    const html = renderToStaticMarkup(<DocumentAmountsFix itemsSum={135558.33} total={162670} onAddVat={() => undefined} onMatchTotal={() => undefined} />)

    expect(html).toContain('135')
    expect(html).toContain('Прибавить НДС к позициям')
    expect(html).toContain('Сумма документа по позициям')
  })

  it('appears in the editor only while item amounts differ from the total', () => {
    const matching = renderToStaticMarkup(<DocumentEditor data={data} disabled={false} onSave={() => undefined} />)
    const differing = renderToStaticMarkup(<DocumentEditor data={{ ...data, total: 1200 }} disabled={false} onSave={() => undefined} />)

    expect(matching).not.toContain('Расхождение сумм')
    expect(differing).toContain('Расхождение сумм')
  })
})
