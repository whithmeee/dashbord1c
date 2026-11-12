export type MonthCloseCheckStatus = 'ok' | 'warning' | 'critical'

export type MonthCloseCheck = {
  readonly key: string
  readonly label: string
  readonly count: number
  readonly status: MonthCloseCheckStatus
}

export type MonthCloseSummary = {
  readonly integrationId: number
  readonly month: string
  readonly generatedAt: string
  readonly documentsTotal: number
  readonly documentsFlagged: number
  readonly readiness: number
  readonly checks: readonly MonthCloseCheck[]
}

export type MonthCloseIssue = {
  readonly check: string
  readonly entity: string
  readonly entityLabel: string
  readonly refKey: string
  readonly number: string | null
  readonly date: string | null
  readonly amount: number | null
  readonly message: string
}

export type MonthCloseDetails = {
  readonly check: string
  readonly total: number
  readonly items: readonly MonthCloseIssue[]
}
