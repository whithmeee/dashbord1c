import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api'
import type { DocumentDraft } from '../domain/document-draft'
import { createDocumentStore, type DocumentGateway } from './document-store'

const draft = { id: 12, integrationId: 7, status: 'draft', ready: true } as DocumentDraft
const written = { ...draft, status: 'written', ready: false } as DocumentDraft

function gateway(overrides: Partial<DocumentGateway> = {}): DocumentGateway {
  return {
    list: vi.fn().mockResolvedValue([draft]),
    upload: vi.fn().mockResolvedValue(draft),
    update: vi.fn().mockResolvedValue(draft),
    retry: vi.fn().mockResolvedValue(draft),
    write: vi.fn().mockResolvedValue(written),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('document store', () => {
  it('loads documents and applies upload, write and delete results', async () => {
    const source = gateway()
    const store = createDocumentStore(source, { expireSession: vi.fn() })
    const file = new File(['УПД'], 'upd.txt')

    await store.load(7)
    await store.upload(7, file)
    await store.write(12)
    expect(store.getSnapshot()).toMatchObject({ status: 'success', items: [written] })
    await store.remove(12)
    expect(store.getSnapshot()).toMatchObject({ status: 'success', items: [] })
  })

  it('blocks a duplicate mutation and keeps an actionable error', async () => {
    let finish: (value: DocumentDraft) => void = () => undefined
    const pending = new Promise<DocumentDraft>((resolve) => { finish = resolve })
    const source = gateway({ write: vi.fn().mockReturnValue(pending) })
    const store = createDocumentStore(source, { expireSession: vi.fn() })
    await store.load(7)

    const first = store.write(12)
    const duplicate = store.write(12)
    expect(duplicate).toBe(first)
    finish(written)
    await first
    expect(source.write).toHaveBeenCalledOnce()
  })

  it('expires the session on 401 and ignores stale responses after reset', async () => {
    const session = { expireSession: vi.fn() }
    const unauthorized = gateway({ list: vi.fn().mockRejectedValue(new ApiError('Unauthorized', { kind: 'http', status: 401 })) })
    const store = createDocumentStore(unauthorized, session)
    await store.load(7)
    expect(session.expireSession).toHaveBeenCalledOnce()
    expect(store.getSnapshot()).toEqual({ status: 'idle' })

    let finish: (value: readonly DocumentDraft[]) => void = () => undefined
    const pending = new Promise<readonly DocumentDraft[]>((resolve) => { finish = resolve })
    const staleStore = createDocumentStore(gateway({ list: vi.fn().mockReturnValue(pending) }), session)
    const request = staleStore.load(7)
    staleStore.reset()
    finish([draft])
    await request
    expect(staleStore.getSnapshot()).toEqual({ status: 'idle' })
  })
})
