import { describe, expect, it, vi } from 'vitest'
import type { ApiClient } from '../../../../shared/api'
import { ApiError } from '../../../../shared/api'
import { createHttpEmployeesGateway } from './http-employees-gateway'

const employeeDto = {
  id: 4,
  company_id: 2,
  name: 'Иван',
  position: 'Бухгалтер',
  login: 'ivan',
  is_online: false,
  last_seen_at: null,
}

describe('createHttpEmployeesGateway', () => {
  it('lists employees and supports an empty response', async () => {
    const get = vi.fn().mockResolvedValue([])
    const gateway = createHttpEmployeesGateway({ get } as unknown as ApiClient)

    await expect(gateway.list()).resolves.toEqual([])
    expect(get).toHaveBeenCalledWith('/cabinet/employees', {})
  })

  it('creates an employee with the Laravel payload', async () => {
    const post = vi.fn().mockResolvedValue(employeeDto)
    const gateway = createHttpEmployeesGateway({ post } as unknown as ApiClient)
    const input = { name: 'Иван', position: 'Бухгалтер', login: 'ivan', password: 'secret-pass1' }

    await expect(gateway.create(input)).resolves.toEqual({
      id: 4,
      companyId: 2,
      name: 'Иван',
      position: 'Бухгалтер',
      login: 'ivan',
      isOnline: false,
      lastSeenAt: null,
    })
    expect(post).toHaveBeenCalledWith('/cabinet/employees', input, {})
  })

  it('updates only provided fields and forwards the signal', async () => {
    const patch = vi.fn().mockResolvedValue(employeeDto)
    const gateway = createHttpEmployeesGateway({ patch } as unknown as ApiClient)
    const signal = new AbortController().signal

    await gateway.update(4, { position: 'Главбух' }, { signal })
    expect(patch).toHaveBeenCalledWith('/cabinet/employees/4', { position: 'Главбух' }, { signal })
  })

  it('removes an employee with a 204 response', async () => {
    const remove = vi.fn().mockResolvedValue(undefined)
    const gateway = createHttpEmployeesGateway({ delete: remove } as unknown as ApiClient)

    await expect(gateway.remove(4)).resolves.toBeUndefined()
    expect(remove).toHaveBeenCalledWith('/cabinet/employees/4', {})
  })

  it.each([403, 404, 422])('preserves ApiError status %s', async (status) => {
    const error = new ApiError('Request failed', { kind: 'http', status })
    const gateway = createHttpEmployeesGateway({ get: vi.fn().mockRejectedValue(error) } as unknown as ApiClient)

    await expect(gateway.list()).rejects.toBe(error)
  })
})
