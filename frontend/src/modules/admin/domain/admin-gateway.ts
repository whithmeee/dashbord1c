import type { AdminRecord, CompanyOption, Input, Page, Resource, Statistics } from './admin'

export interface AdminGateway {
  list(
    resource: Resource,
    params: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<Page>
  detail(
    resource: 'companies' | 'users',
    id: number,
    signal?: AbortSignal,
  ): Promise<AdminRecord>
  create(resource: Resource, input: Input): Promise<string | undefined>
  update(resource: Resource, id: number, input: Input): Promise<void>
  remove(resource: Resource, id: number): Promise<void>
  resetPassword(resource: 'companies' | 'users', id: number): Promise<string>
  employees(
    id: number,
    signal?: AbortSignal,
  ): Promise<(AdminRecord & { login: string; position: string })[]>
  companyOptions(signal?: AbortSignal): Promise<CompanyOption[]>
  test(id: number): Promise<void>
  statistics(
    params: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<Statistics>
}
