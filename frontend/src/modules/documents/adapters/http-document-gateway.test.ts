import { describe, expect, it, vi } from 'vitest'
import type { ApiClient } from '../../../shared/api'
import { mapDocumentDraft } from '../domain/document-draft-mapper'
import { draftResponse } from '../testing/document-draft-fixture'
import { createHttpDocumentGateway } from './http-document-gateway'

describe('document HTTP gateway', () => {
  it('uses every document endpoint and preserves multipart upload', async () => {
    const get = vi.fn().mockResolvedValue([draftResponse])
    const postForm = vi.fn().mockResolvedValue(draftResponse)
    const post = vi.fn().mockResolvedValue(draftResponse)
    const patch = vi.fn().mockResolvedValue(draftResponse)
    const remove = vi.fn().mockResolvedValue(undefined)
    const gateway = createHttpDocumentGateway({ get, postForm, post, patch, delete: remove } as unknown as ApiClient)
    const file = new File(['УПД'], 'upd.txt', { type: 'text/plain' })
    const signal = new AbortController().signal

    await gateway.list(7, { signal })
    await gateway.upload(7, file, { signal })
    await gateway.update(12, mapDocumentDraft(draftResponse).data, { signal })
    await gateway.retry(12, { signal })
    await gateway.write(12, { signal })
    await gateway.remove(12, { signal })

    expect(get).toHaveBeenCalledWith('/api/documents?integration_id=7', { signal })
    expect(postForm).toHaveBeenCalledWith('/api/documents', expect.any(FormData), { signal })
    expect(patch).toHaveBeenCalledWith('/api/documents/12', {
      data: {
        type: 'receipt',
        number: '418',
        date: '2026-11-10',
        total: 1000,
        counterparty: { name: 'ООО Ромашка', inn: '7701234567', kpp: '' },
        buyer: { name: 'ООО Осминог', inn: '7799999999', kpp: '' },
        items: [{ name: 'Болт М8', quantity: 10, price: 100, amount: 1000, vat_rate: '20%' }],
      },
    }, { signal })
    expect(post).toHaveBeenNthCalledWith(1, '/api/documents/12/retry', undefined, { signal })
    expect(post).toHaveBeenNthCalledWith(2, '/api/documents/12/write', undefined, { signal })
    expect(remove).toHaveBeenCalledWith('/api/documents/12', { signal })
  })
})
