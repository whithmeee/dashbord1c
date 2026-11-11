import { describe, expect, it, vi } from 'vitest'
import { createAdminGateway } from './admin-gateway'
import type { ApiClient } from '../../../shared/api'

describe('admin gateway', () => {
  it('loads pagination and forwards filters and cancellation', async () => {
    const get = vi.fn().mockResolvedValue({
      data: [{ id: 1, name: 'Company', email: 'a@b.c' }],
      meta: { current_page: 2, last_page: 3 },
    })
    const gateway = createAdminGateway({ get } as unknown as ApiClient)
    const signal = new AbortController().signal
    const result = await gateway.list(
      'companies',
      { page: '2', search: 'ООО' },
      signal,
    )
    expect(get).toHaveBeenCalledWith(
      '/admin-panel/companies?page=2&search=%D0%9E%D0%9E%D0%9E',
      { signal },
    )
    expect(result.page).toBe(2)
    expect(result.lastPage).toBe(3)
    expect(result.items[0].name).toBe('Company')
  })
  it('does not retain passwords or upstream connection credentials in records', async () => {
    const get = vi.fn().mockResolvedValue([
      {
        id: 3,
        name: 'Base',
        company_id: 1,
        is_active: true,
        password: 'secret',
      },
    ])
    const result = await createAdminGateway({
      get,
    } as unknown as ApiClient).list('integrations', {})
    expect(JSON.stringify(result)).not.toContain('secret')
  })
  it('uses exact mutation and detail endpoints and preserves errors', async () => {
    const failure = new Error('failure')
    const post = vi.fn().mockRejectedValue(failure)
    const gateway = createAdminGateway({ post } as unknown as ApiClient)
    await expect(gateway.resetPassword('users', 7)).rejects.toBe(failure)
    expect(post).toHaveBeenCalledWith('/admin-panel/users/7/reset-password', {})
  })
  it('rejects malformed mandatory DTO', async () => {
    const get = vi.fn().mockResolvedValue({
      data: [{ name: 'No ID' }],
      meta: { current_page: 1, last_page: 1 },
    })
    await expect(
      createAdminGateway({ get } as unknown as ApiClient).list('users', {}),
    ).rejects.toThrow()
  })
})

it('covers company and user CRUD, details, credentials and employee listing', async () => {
  const post = vi.fn().mockResolvedValue({ initial_password: 'once' })
  const patch = vi.fn().mockResolvedValue({})
  const remove = vi.fn().mockResolvedValue(undefined)
  const get = vi.fn().mockResolvedValue({ id: 4, name: 'Name' })
  const gateway = createAdminGateway({
    post,
    patch,
    delete: remove,
    get,
  } as unknown as ApiClient)
  for (const resource of ['companies', 'users'] as const) {
    expect(await gateway.create(resource, { name: 'Name' })).toBe('once')
    expect(post).toHaveBeenLastCalledWith('/admin-panel/' + resource, {
      name: 'Name',
    })
    await gateway.update(resource, 4, { name: 'Changed' })
    expect(patch).toHaveBeenLastCalledWith('/admin-panel/' + resource + '/4', {
      name: 'Changed',
    })
    await gateway.detail(resource, 4)
    expect(get).toHaveBeenLastCalledWith('/admin-panel/' + resource + '/4', {
      signal: undefined,
    })
    await gateway.remove(resource, 4)
    expect(remove).toHaveBeenLastCalledWith('/admin-panel/' + resource + '/4')
  }
  get.mockResolvedValueOnce([])
  expect(await gateway.employees(4)).toEqual([])
  expect(get).toHaveBeenLastCalledWith('/admin-panel/companies/4/employees', {
    signal: undefined,
  })
})
it('discards diagnostic bodies and uses only explicit GET for 1C test', async () => {
  const get = vi
    .fn()
    .mockResolvedValue({ status: 'success', data: { secret: 'do not expose' } })
  const gateway = createAdminGateway({ get } as unknown as ApiClient)
  expect(await gateway.test(9)).toBeUndefined()
  expect(get).toHaveBeenCalledExactlyOnceWith(
    '/admin-panel/integrations/9/test',
  )
})
