import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { mapDocumentDraft } from '../domain/document-draft-mapper'
import { draftResponse } from '../testing/document-draft-fixture'
import { DocumentAmountsFix } from './document-amounts-fix'
import { DocumentEditor } from './document-editor'

const data = mapDocumentDraft(draftResponse).data

describe('document amounts fix', () => {
  it('explains the mismatch and offers both ways to fix it', () => {
    const items = [data.items[0], { ...data.items[0], name: 'Пирог', amount: 500 }]
    const html = renderToStaticMarkup(<DocumentAmountsFix items={items} total={1800} onAddVat={() => undefined} onMatchTotal={() => undefined} />)

    expect(html).toContain('Выбрать все позиции (2 из 2)')
    expect(html).toContain('1. Болт М8')
    expect(html).toContain('2. Пирог')
    expect(html).toContain('Прибавить НДС к выбранным (2)')
    expect(html).toContain('Сумма документа = сумме позиций')
    expect(html).toMatch(/сумма позиций будет 1\s800 ₽/)
  })

  it('appears in the editor only while item amounts differ from the total', () => {
    const matching = renderToStaticMarkup(<DocumentEditor data={data} disabled={false} onSave={() => undefined} />)
    const differing = renderToStaticMarkup(<DocumentEditor data={{ ...data, total: 1200 }} disabled={false} onSave={() => undefined} />)

    expect(matching).not.toContain('Расхождение сумм')
    expect(differing).toContain('Расхождение сумм')
  })
})
