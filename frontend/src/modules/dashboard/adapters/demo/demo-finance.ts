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

export const demoVat: ReportPoint[] = [
  { label: 'Май', amount: 358000 },
  { label: 'Июн', amount: 446000 },
  { label: 'Июл', amount: 403000 },
  { label: 'Авг', amount: 517000 },
  { label: 'Сен', amount: 479000 },
  { label: 'Окт', amount: 607000 },
]

export const demoReceivables: ReportPoint[] = [
  { label: 'Май', amount: 3120000 },
  { label: 'Июн', amount: 3380000 },
  { label: 'Июл', amount: 3010000 },
  { label: 'Авг', amount: 3650000 },
  { label: 'Сен', amount: 3490000 },
  { label: 'Окт', amount: 3860000 },
]

export const demoPayables: ReportPoint[] = [
  { label: 'Май', amount: 1860000 },
  { label: 'Июн', amount: 2010000 },
  { label: 'Июл', amount: 1940000 },
  { label: 'Авг', amount: 2230000 },
  { label: 'Сен', amount: 2160000 },
  { label: 'Окт', amount: 2390000 },
]

export const demoCashBalance: ReportPoint[] = [
  { label: 'Май', amount: 4200000 },
  { label: 'Июн', amount: 4930000 },
  { label: 'Июл', amount: 5360000 },
  { label: 'Авг', amount: 5810000 },
  { label: 'Сен', amount: 6570000 },
  { label: 'Окт', amount: 7520000 },
]

export function createDemoFinance(revenue: ReportPoint[], start: number) {
  return {
    expenses: demoExpenses.slice(start),
    receipts: demoReceipts.slice(start),
    payments: demoPayments.slice(start),
    vat: demoVat.slice(start),
    receivables: demoReceivables.slice(start),
    payables: demoPayables.slice(start),
    cashBalance: demoCashBalance.slice(start),
    result: revenue.slice(start).map((point, index) => ({
      label: point.label,
      amount: point.amount - demoExpenses[start + index].amount,
    })),
  }
}
