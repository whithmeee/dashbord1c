export type SalesReportPeriod = { from: string; to: string }

export type SalesReportMoney = {
  currencyKey: string | null
  currency: string | null
  currencyStatus: string
  amountScale: number | null
  unit: string
}

export type CurrencyOption = { key: string; name: string; documentCount: number }
export type MonthlyAmount = { period: string; amount: number; documentCount: number }
export type RankedAmount = { key: string; name: string; amount: number; documentCount: number }

export type SalesReport = {
  integrationId: number
  availablePeriod: { to: string } | null
  period: SalesReportPeriod | null
  financialStatus: 'available' | 'empty'
  financialStatusCode: string | null
  money: SalesReportMoney
  currencies: readonly CurrencyOption[]
  metrics: { salesDocuments: number; customers: number; organizations: number }
  monthly: readonly MonthlyAmount[]
  customers: readonly RankedAmount[]
  organizations: readonly RankedAmount[]
  receipts: readonly MonthlyAmount[]
  payments: readonly MonthlyAmount[]
  totalAmount: number
}
