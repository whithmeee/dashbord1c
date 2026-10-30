export type DashboardPeriod = 'quarter' | 'half-year'

export type ReportPoint = { label: string; amount: number }
export type DashboardReport = {
  revenue: ReportPoint[]
  debtors: ReportPoint[]
  expenses: ReportPoint[]
  result: ReportPoint[]
  receipts: ReportPoint[]
  payments: ReportPoint[]
  revenueTotal: number
  topFiveDebt: number
  debtAsOf: string
}
export type DashboardResult =
  | { status: 'ready'; report: DashboardReport }
  | { status: 'empty' }
  | { status: 'error'; message: string }
