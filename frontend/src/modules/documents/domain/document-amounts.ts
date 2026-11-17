import type { DocumentItem } from './document-draft'

export const vatRates = [22, 20, 10, 7, 5] as const

const CENT = 0.01

export function itemsSum(items: readonly DocumentItem[]): number {
  return round(items.reduce((sum, item) => sum + item.amount, 0))
}

export function amountsDifference(items: readonly DocumentItem[], total: number): number {
  const difference = round(itemsSum(items) - total)
  return Math.abs(difference) > CENT ? difference : 0
}

export function addVat(items: readonly DocumentItem[], rate: number, indexes?: readonly number[]): readonly DocumentItem[] {
  const factor = 1 + rate / 100
  return items.map((item, index) => indexes === undefined || indexes.includes(index)
    ? { ...item, price: round(item.price * factor), amount: round(item.amount * factor) }
    : item)
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
