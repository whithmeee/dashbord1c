import { api, type ApiClient, type RequestOptions } from '../../../../shared/api'
import type { SalesDocument, SalesDocumentsPage } from '../../domain/sales-document'

export type SalesDocumentsQuery = {
  integrationId: number
  from: string
  to: string
  currencyKey: string
  customerKey?: string
  organizationKey?: string
  page?: number
  perPage?: number
}

export interface SalesDocumentsSource {
  get(query: SalesDocumentsQuery, options?: RequestOptions): Promise<SalesDocumentsPage>
}

export function createHttpSalesDocumentsSource(client: ApiClient): SalesDocumentsSource {
  return {
    async get(query, options = {}) {
      const params = new URLSearchParams({
        integration_id: String(query.integrationId),
        from: query.from,
        to: query.to,
        currency_key: query.currencyKey,
      })
      if (query.customerKey) params.set('customer_key', query.customerKey)
      if (query.organizationKey) params.set('organization_key', query.organizationKey)
      params.set('page', String(query.page ?? 1))
      params.set('per_page', String(query.perPage ?? 20))
      return mapPage(await client.get<unknown>(`/cabinet/finance/sales/documents?${params.toString()}`, options))
    },
  }
}

function mapPage(value: unknown): SalesDocumentsPage {
  const payload = record(value)
  const pagination = record(payload.pagination)
  if (!Array.isArray(payload.items)) throw new Error('items must be an array')
  return {
    items: payload.items.map(mapDocument),
    pagination: {
      page: integer(pagination.page),
      perPage: integer(pagination.per_page),
      total: integer(pagination.total),
      lastPage: integer(pagination.last_page),
    },
  }
}

function mapDocument(value: unknown): SalesDocument {
  const item = record(value)
  const customer = record(item.customer)
  const organization = record(item.organization)
  return {
    id: string(item.id),
    date: string(item.date),
    amount: decimal(item.amount),
    currencyKey: string(item.currency_key),
    customer: { key: string(customer.key), name: string(customer.name) },
    organization: { key: string(organization.key), name: string(organization.name) },
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected object')
  return value as Record<string, unknown>
}
function string(value: unknown): string { if (typeof value !== 'string') throw new Error('Expected string'); return value }
function integer(value: unknown): number { if (!Number.isSafeInteger(value)) throw new Error('Expected integer'); return value as number }
function decimal(value: unknown): number { const raw = string(value); if (!/^-?\d+(?:\.\d+)?$/.test(raw)) throw new Error('Expected decimal'); return Number(raw) }

export const salesDocumentsSource = createHttpSalesDocumentsSource(api)
