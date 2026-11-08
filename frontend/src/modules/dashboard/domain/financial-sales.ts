export type SalesReportPeriod = {
  from: string
  to: string
}

export type SalesReportMoney = {
  currency: string | null
  currencyStatus: string
  amountScale: number
  unit: string
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
  money: SalesReportMoney
  monthly: readonly MonthlySales[]
  totalAmountMinor: number
  customers: readonly CustomerSales[]
  customersTotalAmountMinor: number
}
