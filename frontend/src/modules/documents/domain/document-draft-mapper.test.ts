import { describe, expect, it } from 'vitest'
import { mapDocumentDraft, mapDocumentDrafts } from './document-draft-mapper'

export const draftResponse = {
  id: 12,
  integration_id: 7,
  file_name: 'upd.pdf',
  profile: 'accounting',
  status: 'draft',
  ready: true,
  data: {
    type: 'receipt',
    number: '418',
    date: '2026-11-10',
    counterparty: { name: 'ООО Ромашка', inn: '7701234567', kpp: '', ref_key: 'supplier-1', match: 'found', catalog_name: 'Ромашка' },
    buyer: { name: 'ООО Осминог', inn: '7799999999', kpp: '', ref_key: 'buyer-1', match: 'found', catalog_name: 'Осминог' },
    contract: { ref_key: 'contract-1', match: 'found' },
    items: [{ name: 'Болт М8', quantity: 10, price: 100, amount: 1000, vat_rate: '20%', ref_key: 'item-1', match: 'found' }],
    total: 1000,
  },
  issues: [{ level: 'warning', field: 'contract', message: 'Проверьте договор.' }],
  onec_number: null,
  written_at: null,
  created_at: '2026-11-12T12:00:00Z',
}

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
