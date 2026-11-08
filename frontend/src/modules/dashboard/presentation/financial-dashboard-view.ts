import type { DashboardPeriod } from '../domain/dashboard-report'
import type { SalesReport } from '../domain/financial-sales'

export type FinancialSalesView =
  | { kind: 'empty' }
  | { kind: 'currency-unavailable'; message: string }
  | {
      kind: 'ready'
      monthly: SalesReport['monthly']
      customers: SalesReport['customers']
      totalAmountMinor: number
    }

export function periodToRange(period: DashboardPeriod, now = new Date()) {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const months = period === 'quarter' ? 3 : 6
  const start = new Date(Date.UTC(year, month - months + 1, 1))
  const end = new Date(Date.UTC(year, month + 1, 0))
  return { from: formatDate(start), to: formatDate(end) }
}

export function buildFinancialSalesView(report: SalesReport): FinancialSalesView {
  if (
    report.financialStatus === 'unavailable' ||
    report.money.currency === null ||
    report.money.currencyStatus !== 'confirmed' ||
    report.money.amountScale === null ||
    report.money.unit === null ||
    report.totalAmountMinor === null ||
    report.customersTotalAmountMinor === null
  ) {
    return {
      kind: 'currency-unavailable',
      message: 'Валюта документов не подтверждена. Денежные показатели временно недоступны',
    }
  }

  if (report.monthly.length === 0 && report.customers.length === 0) {
    return { kind: 'empty' }
  }

  return {
    kind: 'ready',
    monthly: report.monthly,
    customers: report.customers,
    totalAmountMinor: report.totalAmountMinor,
  }
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
