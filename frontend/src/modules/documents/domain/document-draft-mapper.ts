import type { DocumentContract, DocumentData, DocumentDraft, DocumentIssue, DocumentItem, DocumentMatch, DocumentParty } from './document-draft'
import { array, boolean, choice, integer, nullableString, number, record, string } from './document-draft-reader'

const matches = ['found', 'matched', 'missing'] as const

export function mapDocumentDrafts(value: unknown): readonly DocumentDraft[] {
  return array(value, 'documents').map(mapDocumentDraft)
}

export function mapDocumentDraft(value: unknown): DocumentDraft {
  const source = record(value, 'document')
  return {
    id: integer(source.id, 'document.id'),
    integrationId: integer(source.integration_id, 'document.integration_id'),
    fileName: string(source.file_name, 'document.file_name'),
    profile: string(source.profile, 'document.profile'),
    status: choice(source.status, ['draft', 'written'], 'document.status'),
    ready: boolean(source.ready, 'document.ready'),
    data: mapData(source.data),
    issues: array(source.issues, 'document.issues').map(mapIssue),
    onecNumber: nullableString(source.onec_number, 'document.onec_number'),
    writtenAt: nullableString(source.written_at, 'document.written_at'),
    createdAt: string(source.created_at, 'document.created_at'),
  }
}

function mapData(value: unknown): DocumentData {
  const source = record(value, 'document.data')
  return {
    type: choice(source.type, ['receipt', 'invoice'], 'document.data.type'),
    number: string(source.number, 'document.data.number'),
    date: string(source.date, 'document.data.date'),
    counterparty: mapParty(source.counterparty, 'document.data.counterparty'),
    buyer: mapParty(source.buyer, 'document.data.buyer'),
    contract: mapContract(source.contract),
    items: array(source.items, 'document.data.items').map(mapItem),
    total: number(source.total, 'document.data.total'),
  }
}

function mapParty(value: unknown, path: string): DocumentParty {
  const source = record(value, path)
  return {
    name: string(source.name, `${path}.name`),
    inn: string(source.inn, `${path}.inn`),
    kpp: string(source.kpp, `${path}.kpp`),
    refKey: nullableString(source.ref_key, `${path}.ref_key`),
    catalogName: source.catalog_name === undefined ? null : nullableString(source.catalog_name, `${path}.catalog_name`),
    match: mapMatch(source.match, `${path}.match`),
  }
}

function mapContract(value: unknown): DocumentContract {
  const source = record(value, 'document.data.contract')
  return {
    refKey: nullableString(source.ref_key, 'document.data.contract.ref_key'),
    match: mapMatch(source.match, 'document.data.contract.match'),
  }
}

function mapItem(value: unknown, index: number): DocumentItem {
  const path = `document.data.items.${index}`
  const source = record(value, path)
  return {
    name: string(source.name, `${path}.name`),
    quantity: number(source.quantity, `${path}.quantity`),
    price: number(source.price, `${path}.price`),
    amount: number(source.amount, `${path}.amount`),
    vatRate: string(source.vat_rate, `${path}.vat_rate`),
    refKey: nullableString(source.ref_key, `${path}.ref_key`),
    match: mapMatch(source.match, `${path}.match`),
  }
}

function mapIssue(value: unknown, index: number): DocumentIssue {
  const path = `document.issues.${index}`
  const source = record(value, path)
  return {
    level: choice(source.level, ['error', 'warning'], `${path}.level`),
    field: string(source.field, `${path}.field`),
    message: string(source.message, `${path}.message`),
  }
}

function mapMatch(value: unknown, path: string): DocumentMatch {
  return choice(value, matches, path)
}
