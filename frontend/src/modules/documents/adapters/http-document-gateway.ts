import { api, type ApiClient, type RequestOptions } from '../../../shared/api'
import type { DocumentData, DocumentDraft } from '../domain/document-draft'
import { mapDocumentDraft, mapDocumentDrafts } from '../domain/document-draft-mapper'

export interface DocumentGateway {
  list(integrationId: number, options?: RequestOptions): Promise<readonly DocumentDraft[]>
  upload(integrationId: number, file: File, options?: RequestOptions): Promise<DocumentDraft>
  update(id: number, data: DocumentData, options?: RequestOptions): Promise<DocumentDraft>
  retry(id: number, options?: RequestOptions): Promise<DocumentDraft>
  write(id: number, options?: RequestOptions): Promise<DocumentDraft>
  remove(id: number, options?: RequestOptions): Promise<void>
}

export function createHttpDocumentGateway(client: ApiClient): DocumentGateway {
  return {
    async list(integrationId, options = {}) {
      return mapDocumentDrafts(await client.get<unknown>(`/api/documents?integration_id=${integrationId}`, options))
    },
    async upload(integrationId, file, options = {}) {
      const form = new FormData()
      form.set('integration_id', String(integrationId))
      form.set('file', file)
      return mapDocumentDraft(await client.postForm<unknown>('/api/documents', form, options))
    },
    async update(id, data, options = {}) {
      return mapDocumentDraft(await client.patch<unknown>(`/api/documents/${id}`, { data: toRequest(data) }, options))
    },
    async retry(id, options = {}) {
      return mapDocumentDraft(await client.post<unknown>(`/api/documents/${id}/retry`, undefined, options))
    },
    async write(id, options = {}) {
      return mapDocumentDraft(await client.post<unknown>(`/api/documents/${id}/write`, undefined, options))
    },
    async remove(id, options = {}) {
      await client.delete(`/api/documents/${id}`, options)
    },
  }
}

function toRequest(data: DocumentData): Record<string, unknown> {
  return {
    type: data.type,
    number: data.number,
    date: data.date,
    total: data.total,
    counterparty: toParty(data.counterparty),
    buyer: toParty(data.buyer),
    items: data.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      amount: item.amount,
      vat_rate: item.vatRate,
    })),
  }
}

function toParty(party: DocumentData['counterparty']): Record<string, string> {
  return { name: party.name, inn: party.inn, kpp: party.kpp }
}

export const documentGateway = createHttpDocumentGateway(api)
