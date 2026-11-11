export type SalesDocument = {
  id: string
  date: string
  amount: number
  currencyKey: string
  customer: { key: string; name: string }
  organization: { key: string; name: string }
}

export type SalesDocumentsPage = {
  items: readonly SalesDocument[]
  pagination: { page: number; perPage: number; total: number; lastPage: number }
}
