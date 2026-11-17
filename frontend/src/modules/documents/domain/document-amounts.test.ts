import { describe, expect, it } from 'vitest'
import { mapDocumentDraft } from './document-draft-mapper'
import { addVat, amountsDifference, itemsSum } from './document-amounts'
import { draftResponse } from '../testing/document-draft-fixture'

const items = mapDocumentDraft({
  ...draftResponse,
  data: {
    ...draftResponse.data,
    items: [
      { ...draftResponse.data.items[0], price: 166.67, amount: 29333.33 },
      { ...draftResponse.data.items[0], price: 166.67, amount: 500 },
    ],
  },
}).data.items

describe('document amounts', () => {
  it('sums item amounts to cents', () => {
    expect(itemsSum(items)).toBe(29833.33)
  })

  it('reports the difference with the document total and ignores a cent of rounding', () => {
    expect(amountsDifference(items, 35800)).toBe(-5966.67)
    expect(amountsDifference(items, 29833.34)).toBe(0)
  })

  it('adds VAT to prices and amounts of every item', () => {
    const raised = addVat(items, 20)

    expect(raised.map((item) => item.amount)).toEqual([35200, 600])
    expect(raised.map((item) => item.price)).toEqual([200, 200])
    expect(raised[0].name).toBe(items[0].name)
  })

  it('adds VAT only to the chosen items', () => {
    const raised = addVat(items, 20, [1])

    expect(raised.map((item) => item.amount)).toEqual([29333.33, 600])
    expect(raised[0]).toBe(items[0])
  })
})
