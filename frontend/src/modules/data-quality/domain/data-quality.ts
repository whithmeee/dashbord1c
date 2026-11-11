export const dataQualitySeverities = ['critical', 'warning', 'info'] as const
export const dataQualityCategories = ['tax_details', 'duplicates', 'contracts'] as const

export type DataQualitySeverity = typeof dataQualitySeverities[number]
export type DataQualityCategory = typeof dataQualityCategories[number]

export type DataQualityCapabilities = {
  readonly taxDetails: boolean
  readonly innValidation: boolean
  readonly kppValidation: boolean
  readonly legalType: boolean
  readonly contracts: boolean
}

export type DataQualityTotals = {
  readonly critical: number
  readonly warning: number
  readonly info: number
  readonly checkedObjects: number
  readonly issues: number
}

export type DataQualitySummary = {
  readonly integrationId: number
  readonly checkedAt: string
  readonly totals: DataQualityTotals
  readonly capabilities: DataQualityCapabilities
}

export type DataQualityIssue = {
  readonly id: string
  readonly rule: string
  readonly severity: DataQualitySeverity
  readonly category: DataQualityCategory
  readonly entity: string
  readonly objectId: string
  readonly title: string
  readonly message: string
  readonly fields: Readonly<Record<string, string>>
}

export type DataQualityReport = {
  readonly summary: DataQualitySummary
  readonly issues: readonly DataQualityIssue[]
}
