import type { AdminGateway } from '../domain/admin-gateway'
import { api, type ApiClient } from '../../../shared/api'
import {
  mapRecord,
  record,
  type Resource,
  type Input,
  type Page,
  type Statistics,
} from '../domain/admin'

export function createAdminGateway(client: ApiClient): AdminGateway {
  const path = (resource: Resource, id?: number) =>
    `/admin-panel/${resource}${id === undefined ? '' : `/${id}`}`
  const query = (params: Record<string, string>) => {
    const search = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== ''),
    )
    return search.size ? `?${search}` : ''
  }
  const credential = (value: unknown) => {
    const dto = record(value)
    if (typeof dto.initial_password !== 'string')
      throw new Error(
        'Пароль не получен. Обновите список перед следующим действием.',
      )
    return dto.initial_password
  }
  return {
    async list(
      resource: Resource,
      params: Record<string, string>,
      signal?: AbortSignal,
    ): Promise<Page> {
      const raw = await client.get<unknown>(path(resource) + query(params), {
        signal,
      })
      if (resource === 'integrations') {
        if (!Array.isArray(raw)) throw new Error('Некорректный ответ сервера')
        return { items: raw.map(mapRecord), page: 1, lastPage: 1 }
      }
      const dto = record(raw)
      const meta = record(dto.meta)
      if (
        !Array.isArray(dto.data) ||
        !Number.isInteger(meta.current_page) ||
        !Number.isInteger(meta.last_page)
      )
        throw new Error('Некорректная пагинация')
      return {
        items: dto.data.map(mapRecord),
        page: Number(meta.current_page),
        lastPage: Number(meta.last_page),
      }
    },
    async detail(
      resource: 'companies' | 'users',
      id: number,
      signal?: AbortSignal,
    ) {
      return mapRecord(
        await client.get<unknown>(path(resource, id), { signal }),
      )
    },
    async create(resource: Resource, input: Input) {
      const result = await client.post<unknown>(path(resource), input)
      return resource === 'integrations' ? undefined : credential(result)
    },
    async update(resource: Resource, id: number, input: Input) {
      await client.patch<unknown>(path(resource, id), input)
    },
    async remove(resource: Resource, id: number) {
      await client.delete<unknown>(path(resource, id))
    },
    async resetPassword(resource: 'companies' | 'users', id: number) {
      return credential(
        await client.post<unknown>(path(resource, id) + '/reset-password', {}),
      )
    },
    async employees(id: number, signal?: AbortSignal) {
      const raw = await client.get<unknown>(
        path('companies', id) + '/employees',
        { signal },
      )
      if (!Array.isArray(raw))
        throw new Error('Некорректный список сотрудников')
      return raw.map((value) => {
        const dto = record(value)
        return {
          ...mapRecord(dto),
          login: String(dto.login ?? ''),
          position: String(dto.position ?? ''),
        }
      })
    },
    async test(id: number) {
      const dto = record(
        await client.get<unknown>(path('integrations', id) + '/test'),
      )
      if (dto.status !== 'success')
        throw new Error('Подключение не подтверждено')
    },
    async statistics(
      params: Record<string, string>,
      signal?: AbortSignal,
    ): Promise<Statistics> {
      const dto = record(
        await client.get<unknown>('/admin-panel/statistics' + query(params), {
          signal,
        }),
      )
      if (
        typeof dto.total !== 'number' ||
        !Array.isArray(dto.by_period) ||
        !Array.isArray(dto.by_integration)
      )
        throw new Error('Некорректная статистика')
      return dto as Statistics
    },
  }
}
export const adminGateway = createAdminGateway(api)
