export type DocumentStatus = 'draft' | 'written'
export type DocumentType = 'receipt' | 'invoice'
export type DocumentMatch = 'found' | 'matched' | 'missing'
export type DocumentIssueLevel = 'error' | 'warning'

export type DocumentParty = {
  readonly name: string
  readonly inn: string
  readonly kpp: string
  readonly refKey: string | null
  readonly catalogName: string | null
  readonly match: DocumentMatch
}

export type DocumentContract = {
  readonly refKey: string | null
  readonly match: DocumentMatch
}

export type DocumentItem = {
  readonly name: string
  readonly quantity: number
  readonly price: number
  readonly amount: number
  readonly vatRate: string
  readonly refKey: string | null
  readonly match: DocumentMatch
}

export type DocumentData = {
  readonly type: DocumentType
  readonly number: string
  readonly date: string
  readonly counterparty: DocumentParty
  readonly buyer: DocumentParty
  readonly contract: DocumentContract
  readonly items: readonly DocumentItem[]
  readonly total: number
}

export type DocumentIssue = {
  readonly level: DocumentIssueLevel
  readonly field: string
  readonly message: string
}

export type DocumentDraft = {
  readonly id: number
  readonly integrationId: number
  readonly fileName: string
  readonly profile: string
  readonly status: DocumentStatus
  readonly ready: boolean
  readonly data: DocumentData
  readonly issues: readonly DocumentIssue[]
  readonly onecNumber: string | null
  readonly writtenAt: string | null
  readonly createdAt: string
}
