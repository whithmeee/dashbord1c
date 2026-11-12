import { describe, expect, it } from 'vitest'
import { draftResponse } from '../testing/document-draft-fixture'
import { mapDocumentDraft, mapDocumentDrafts } from './document-draft-mapper'

describe('document draft mapper', () => {
  it('maps document data, matches and validation issues', () => {
    expect(mapDocumentDraft(draftResponse)).toMatchObject({
      id: 12,
      integrationId: 7,
      fileName: 'upd.pdf',
      status: 'draft',
      ready: true,
      data: {
        type: 'receipt',
        number: '418',
        counterparty: { refKey: 'supplier-1', match: 'found' },
        items: [{ refKey: 'item-1', amount: 1000 }],
      },
      issues: [{ level: 'warning', field: 'contract' }],
    })
  })

  it('maps an unwrapped list and rejects an invalid required field', () => {
    expect(mapDocumentDrafts([draftResponse])).toHaveLength(1)
    expect(() => mapDocumentDraft({ ...draftResponse, id: '12' })).toThrow('document.id')
  })
})
