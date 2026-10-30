import type { ReportPoint } from '../../domain/dashboard-report'

export const demoExpenses: ReportPoint[] = [
  { label: 'Май', amount: 1720000 },
  { label: 'Июн', amount: 1940000 },
  { label: 'Июл', amount: 1880000 },
  { label: 'Авг', amount: 2220000 },
  { label: 'Сен', amount: 2110000 },
  { label: 'Окт', amount: 2490000 },
]

export const demoReceipts: ReportPoint[] = [
  { label: 'Май', amount: 1980000 },
  { label: 'Июн', amount: 2540000 },
  { label: 'Июл', amount: 2610000 },
  { label: 'Авг', amount: 2790000 },
  { label: 'Сен', amount: 3050000 },
  { label: 'Окт', amount: 3320000 },
]

export const demoPayments: ReportPoint[] = [
  { label: 'Май', amount: 1630000 },
  { label: 'Июн', amount: 2010000 },
  { label: 'Июл', amount: 1790000 },
  { label: 'Авг', amount: 2310000 },
  { label: 'Сен', amount: 2050000 },
  { label: 'Окт', amount: 2370000 },
]

export function createDemoFinance(revenue: ReportPoint[], start: number) {
  return {
    expenses: demoExpenses.slice(start),
    receipts: demoReceipts.slice(start),
    payments: demoPayments.slice(start),
    result: revenue.slice(start).map((point, index) => ({
      label: point.label,
      amount: point.amount - demoExpenses[start + index].amount,
    })),
  }
}
