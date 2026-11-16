import { array, integer, nullableString, record, string } from './document-draft-reader'
import type { NomenclatureChoice, NomenclatureOptions, NomenclatureSuggestion, VatRateChoice } from './nomenclature'

export function mapNomenclatureOptions(value: unknown): NomenclatureOptions {
  const source = record(value, 'nomenclature')
  return {
    kinds: array(source.kinds, 'nomenclature.kinds').map((entry, index) => mapChoice(entry, `nomenclature.kinds.${index}`)),
    units: array(source.units, 'nomenclature.units').map((entry, index) => mapChoice(entry, `nomenclature.units.${index}`)),
    vatRates: array(source.vat_rates, 'nomenclature.vat_rates').map(mapVatRate),
    items: array(source.items, 'nomenclature.items').map(mapSuggestion),
  }
}

function mapChoice(value: unknown, path: string): NomenclatureChoice {
  const source = record(value, path)
  return { key: string(source.key, `${path}.key`), name: string(source.name, `${path}.name`) }
}

function mapVatRate(value: unknown, index: number): VatRateChoice {
  const path = `nomenclature.vat_rates.${index}`
  const source = record(value, path)
  return { value: string(source.value, `${path}.value`), label: string(source.label, `${path}.label`) }
}

function mapSuggestion(value: unknown, index: number): NomenclatureSuggestion {
  const path = `nomenclature.items.${index}`
  const source = record(value, path)
  return {
    index: integer(source.index, `${path}.index`),
    name: string(source.name, `${path}.name`),
    kindKey: nullableString(source.kind_key, `${path}.kind_key`),
    unitKey: nullableString(source.unit_key, `${path}.unit_key`),
    vatRate: nullableString(source.vat_rate, `${path}.vat_rate`),
  }
}
