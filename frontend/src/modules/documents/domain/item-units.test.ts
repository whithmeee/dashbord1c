import { describe, expect, it } from 'vitest'
import { mapDocumentDraft } from './document-draft-mapper'
import { NO_UNIT, unitDiffers, unitOptions, withUnit } from './item-units'
import { draftResponse } from '../testing/document-draft-fixture'

const units = [{ key: 'unit-l', name: 'л' }, { key: 'unit-pcs', name: 'шт' }]
const base = mapDocumentDraft(draftResponse).data.items[0]

describe('item units', () => {
  it('reads the unit of the card and the list of units from the draft', () => {
    const data = mapDocumentDraft({
      ...draftResponse,
      data: {
        ...draftResponse.data,
        units: [{ key: 'unit-l', name: 'л' }],
        items: [{ ...draftResponse.data.items[0], unit: 'шт.', unit_key: 'unit-l', unit_name: 'л', catalog_unit_key: 'unit-l' }],
      },
    }).data

    expect(data.units).toEqual([{ key: 'unit-l', name: 'л' }])
    expect(data.items[0]).toMatchObject({ unit: 'шт.', unitKey: 'unit-l', unitName: 'л', catalogUnitKey: 'unit-l' })
  })

  it('offers an empty choice before the units of the base', () => {
    expect(unitOptions(units)).toEqual([
      { value: NO_UNIT, label: 'Не указана' },
      { value: 'unit-l', label: 'л' },
      { value: 'unit-pcs', label: 'шт' },
    ])
  })

  it('reports a difference only between different unit names', () => {
    expect(unitDiffers({ ...base, unit: 'шт.', unitName: 'л' })).toBe(true)
    expect(unitDiffers({ ...base, unit: 'шт.', unitName: 'шт' })).toBe(false)
    expect(unitDiffers({ ...base, unit: '', unitName: 'л' })).toBe(false)
    expect(unitDiffers({ ...base, unit: 'шт', unitName: null })).toBe(false)
  })

  it('applies the chosen unit and clears it for the empty choice', () => {
    expect(withUnit(base, units, 'unit-pcs')).toMatchObject({ unitKey: 'unit-pcs', unitName: 'шт' })
    expect(withUnit(base, units, NO_UNIT)).toMatchObject({ unitKey: null, unitName: null })
  })
})
