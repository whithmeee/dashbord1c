import type { MonthCloseCheck } from '../../month-close/domain/month-close'

export type ReceivablesCheck = MonthCloseCheck

export type ReceivablesSummary = {
  readonly integrationId: number
  readonly month: string
  readonly generatedAt: string
  readonly shipped: number
  readonly paid: number
  readonly outstanding: number
  readonly debtorsTotal: number
  readonly counterpartiesTotal: number
  readonly checks: readonly ReceivablesCheck[]
}

export type ReceivablesIssue = {
  readonly check: string
  readonly counterpartyKey: string
  readonly counterparty: string
  readonly shipped: number
  readonly paid: number
  readonly outstanding: number
  readonly message: string
}

export type ReceivablesDetails = {
  readonly check: string
  readonly total: number
  readonly items: readonly ReceivablesIssue[]
}
