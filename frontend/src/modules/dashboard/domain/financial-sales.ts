export type SalesReportPeriod = {
  from: string
  to: string
}

export type SalesReportMoney = {
  currency: string | null
  currencyStatus: string
  amountScale: number | null
  unit: string | null
}

export type MonthlySales = {
  period: string
  amountMinor: number
}

export type CustomerSales = {
  name: string
  amountMinor: number
}

export type SalesReport = {
  integrationId: number
  period: SalesReportPeriod
  financialStatus: 'available' | 'unavailable'
  financialStatusCode: string | null
  money: SalesReportMoney
  monthly: readonly MonthlySales[]
  totalAmountMinor: number | null
  customers: readonly CustomerSales[]
  customersTotalAmountMinor: number | null
}
