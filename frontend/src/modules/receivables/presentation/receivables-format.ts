import type { ReceivablesSummary } from '../domain/receivables'

const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })

export function formatMoney(value: number): string {
  return money.format(value)
}

export function formatMonth(value: string): string {
  const [year, month] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

export function paidShare(summary: ReceivablesSummary): number {
  if (summary.shipped <= 0) return 100
  return Math.min(100, Math.round((summary.paid / summary.shipped) * 100))
}
