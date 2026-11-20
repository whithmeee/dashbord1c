import type { DocumentItem, UnitChoice } from './document-draft'

export const NO_UNIT = 'none'

export type UnitOption = {
  readonly value: string
  readonly label: string
}

export function unitOptions(units: readonly UnitChoice[]): readonly UnitOption[] {
  return [{ value: NO_UNIT, label: 'Не указана' }, ...units.map(({ key, name }) => ({ value: key, label: name }))]
}

export function unitDiffers(item: DocumentItem): boolean {
  return item.unit !== '' && item.unitName !== null && normalized(item.unit) !== normalized(item.unitName)
}

export function withUnit(item: DocumentItem, units: readonly UnitChoice[], value: string): DocumentItem {
  const chosen = units.find(({ key }) => key === value)

  return { ...item, unitKey: chosen?.key ?? null, unitName: chosen?.name ?? null }
}

function normalized(unit: string): string {
  return unit.trim().toLowerCase().replace(/\.+$/, '')
}
