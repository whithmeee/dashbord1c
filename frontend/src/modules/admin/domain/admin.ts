export type Resource = 'companies' | 'integrations' | 'users'
export type AdminRecord = {
  id: number
  name: string
  email?: string
  company_id?: number
  config_name?: string | null
  odata_url?: string
  login?: string
  is_active?: boolean
  subscription_status?: string
  subscription_starts_at?: string | null
  subscription_ends_at?: string | null
  phone_number?: string | null
  role?: { id: number; name: string; label: string }
  phones?: { phone: string; label?: string | null }[]
  messengers?: { name: string; contact: string }[]
}
export type CompanyOption = { id: number; name: string }
export type Page = { items: AdminRecord[]; page: number; lastPage: number }
export type Input = Record<string, unknown>
export type Statistics = {
  total: number
  period: { from: string; to: string; group: string }
  by_period: { period: string; requests: number }[]
  by_company?: { company_id: number; name: string; requests: number }[]
  by_author?: { type: string; id: number; name: string; requests: number }[]
  by_integration: { integration_id: number; name: string; requests: number }[]
}
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Некорректный ответ сервера')
  return value as Record<string, unknown>
}
export function mapRecord(value: unknown): AdminRecord {
  const dto = record(value)
  if (!Number.isInteger(dto.id) || typeof dto.name !== 'string')
    throw new Error('Некорректный ответ сервера')
  const result: AdminRecord = { id: dto.id as number, name: dto.name }
  const keys = [
    'email',
    'company_id',
    'config_name',
    'odata_url',
    'login',
    'is_active',
    'subscription_status',
    'subscription_starts_at',
    'subscription_ends_at',
    'phone_number',
    'role',
    'phones',
    'messengers',
  ] as const
  for (const key of keys) {
    if (key in dto) Object.assign(result, { [key]: dto[key] })
  }
  return result
}
