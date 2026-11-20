import { api, type ApiClient, type RequestOptions } from '../../../shared/api'
import type { DocumentData, DocumentDraft } from '../domain/document-draft'
import { mapDocumentDraft, mapDocumentDrafts } from '../domain/document-draft-mapper'
import type { NomenclatureOptions, NomenclatureSpec } from '../domain/nomenclature'
import { mapNomenclatureOptions } from '../domain/nomenclature-mapper'

export interface DocumentGateway {
  list(integrationId: number, options?: RequestOptions): Promise<readonly DocumentDraft[]>
  upload(integrationId: number, file: File, options?: RequestOptions): Promise<DocumentDraft>
  update(id: number, data: DocumentData, options?: RequestOptions): Promise<DocumentDraft>
  retry(id: number, options?: RequestOptions): Promise<DocumentDraft>
  nomenclatureOptions(id: number, options?: RequestOptions): Promise<NomenclatureOptions>
  createNomenclature(id: number, specs: readonly NomenclatureSpec[], options?: RequestOptions): Promise<DocumentDraft>
  createCounterparty(id: number, options?: RequestOptions): Promise<DocumentDraft>
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
    async nomenclatureOptions(id, options = {}) {
      return mapNomenclatureOptions(await client.get<unknown>(`/api/documents/${id}/nomenclature-options`, options))
    },
    async createNomenclature(id, specs, options = {}) {
      return mapDocumentDraft(await client.post<unknown>(`/api/documents/${id}/nomenclature`, { items: specs.map(toSpecRequest) }, options))
    },
    async createCounterparty(id, options = {}) {
      return mapDocumentDraft(await client.post<unknown>(`/api/documents/${id}/counterparty`, undefined, options))
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
      unit: item.unit,
      unit_key: item.unitKey,
    })),
  }
}

function toSpecRequest(spec: NomenclatureSpec): Record<string, unknown> {
  return { index: spec.index, kind_key: spec.kindKey, unit_key: spec.unitKey, vat_rate: spec.vatRate }
}

function toParty(party: DocumentData['counterparty']): Record<string, string> {
  return { name: party.name, inn: party.inn, kpp: party.kpp }
}

export const documentGateway = createHttpDocumentGateway(api)
