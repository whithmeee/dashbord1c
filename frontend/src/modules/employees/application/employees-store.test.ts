import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api'
import type { EmployeesGateway } from '../adapters/http/http-employees-gateway'
import type { Employee } from '../domain/employee'
import { createEmployeesStore } from './employees-store'

const employee: Employee = {
  id: 1,
  companyId: 7,
  name: 'Иван',
  position: 'Бухгалтер',
  login: 'ivan',
  isOnline: false,
  lastSeenAt: null,
  createdAt: null,
}

function gateway(overrides: Partial<EmployeesGateway> = {}): EmployeesGateway {
  return {
    list: vi.fn().mockResolvedValue([employee]),
    create: vi.fn().mockResolvedValue(employee),
    update: vi.fn().mockResolvedValue(employee),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function unauthorized(): ApiError {
  return new ApiError('Unauthenticated', { kind: 'http', status: 401 })
}

describe('createEmployeesStore', () => {
  it('loads employees and supports an empty result', async () => {
    const store = createEmployeesStore(gateway({ list: vi.fn().mockResolvedValue([]) }))

    await store.load()

    expect(store.getSnapshot()).toEqual({ status: 'success', employees: [] })
  })

  it('keeps a load error and retries it', async () => {
    const list = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([employee])
    const store = createEmployeesStore(gateway({ list }))

    await store.load()
    expect(store.getSnapshot().status).toBe('error')
    await store.retry()

    expect(store.getSnapshot()).toEqual({ status: 'success', employees: [employee] })
  })

  it('applies successful create, update and remove mutations', async () => {
    const updated = { ...employee, position: 'Главбух' }
    const api = gateway({
      list: vi.fn().mockResolvedValue([employee]),
      create: vi.fn().mockResolvedValue({ ...employee, id: 2 }),
      update: vi.fn().mockResolvedValue(updated),
    })
    const store = createEmployeesStore(api)
    await store.load()

    await store.create({ name: 'Пётр', position: 'Менеджер', login: 'petr', password: 'secret-pass1' })
    await store.update(1, { position: 'Главбух' })
    await store.remove(1)

    expect(store.getSnapshot()).toEqual({
      status: 'success',
      employees: [{ ...employee, id: 2 }],
      mutation: { status: 'idle' },
    })
  })

  it('deduplicates the same mutation while it is pending', async () => {
    let resolveCreate: (value: Employee) => void = () => undefined
    const create = vi.fn().mockImplementation(() => new Promise<Employee>((resolve) => {
      resolveCreate = resolve
    }))
    const store = createEmployeesStore(gateway({ create }))
    const input = { name: 'Иван', position: 'Бухгалтер', login: 'ivan', password: 'secret-pass1' }

    const first = store.create(input)
    const second = store.create(input)
    resolveCreate(employee)

    await Promise.all([first, second])
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('expires the session and clears data on 401', async () => {
    const expireSession = vi.fn()
    const store = createEmployeesStore(gateway({ list: vi.fn().mockRejectedValue(unauthorized()) }), { expireSession })

    await store.load()

    expect(expireSession).toHaveBeenCalledOnce()
    expect(store.getSnapshot()).toEqual({ status: 'idle' })
  })

  it('keeps mutation validation errors without storing the password', async () => {
    const error = new ApiError('Invalid data', {
      kind: 'http',
      status: 422,
      validationErrors: { password: ['The password is invalid.'] },
    })
    const store = createEmployeesStore(gateway({ create: vi.fn().mockRejectedValue(error) }))
    const input = { name: 'Иван', position: 'Бухгалтер', login: 'ivan', password: 'secret-pass1' }

    await store.create(input)

    expect(store.getSnapshot()).toEqual({
      status: 'idle',
      mutation: { status: 'error', operation: 'create', error, validationErrors: error.validationErrors },
    })
    expect(JSON.stringify(store.getSnapshot())).not.toContain(input.password)
  })

  it('ignores a response that arrives after reset', async () => {
    let resolveList: (value: readonly Employee[]) => void = () => undefined
    const list = vi.fn().mockImplementation(() => new Promise<readonly Employee[]>((resolve) => {
      resolveList = resolve
    }))
    const store = createEmployeesStore(gateway({ list }))
    const request = store.load()
    store.reset()
    resolveList([employee])
    await request

    expect(store.getSnapshot()).toEqual({ status: 'idle' })
  })
})
