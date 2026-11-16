export type NomenclatureChoice = {
  readonly key: string
  readonly name: string
}

export type VatRateChoice = {
  readonly value: string
  readonly label: string
}

export type NomenclatureSuggestion = {
  readonly index: number
  readonly name: string
  readonly kindKey: string | null
  readonly unitKey: string | null
  readonly vatRate: string | null
}

export type NomenclatureOptions = {
  readonly kinds: readonly NomenclatureChoice[]
  readonly units: readonly NomenclatureChoice[]
  readonly vatRates: readonly VatRateChoice[]
  readonly items: readonly NomenclatureSuggestion[]
}

export type NomenclatureSpec = {
  readonly index: number
  readonly kindKey: string | null
  readonly unitKey: string | null
  readonly vatRate: string | null
}
