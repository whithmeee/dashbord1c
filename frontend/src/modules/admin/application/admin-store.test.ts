import { expect, it, vi } from 'vitest'
import { AdminStore } from './admin-store'
import type { AdminGateway } from '../domain/admin-gateway'

it('deduplicates loading and ignores stale results after reset', async () => {
  let finish!: (value: unknown) => void
  const list = vi.fn(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const store = new AdminStore({ list } as unknown as AdminGateway, vi.fn())
  const pending = store.load('companies', {})
  void store.load('companies', {})
  expect(list).toHaveBeenCalledOnce()
  store.reset()
  finish({ items: [{ id: 1, name: 'Old company' }], page: 1, lastPage: 1 })
  await pending
  expect(store.getSnapshot().items).toEqual([])
})
it('prevents duplicate mutations and never puts returned credentials in snapshot', async () => {
  let finish!: (value: string) => void
  const store = new AdminStore({} as AdminGateway, vi.fn())
  const operation = vi.fn(
    () =>
      new Promise<string>((resolve) => {
        finish = resolve
      }),
  )
  const pending = store.mutate(operation)
  await store.mutate(operation)
  expect(operation).toHaveBeenCalledOnce()
  finish('secret')
  expect(await pending).toBe('secret')
  expect(JSON.stringify(store.getSnapshot())).not.toContain('secret')
})

it('expires unauthorized sessions and clears data', async () => {
  const { ApiError } = await import('../../../shared/api')
  const expire = vi.fn()
  const list = vi
    .fn()
    .mockResolvedValueOnce({
      items: [{ id: 1, name: 'Company' }],
      page: 1,
      lastPage: 1,
    })
    .mockRejectedValueOnce(
      new ApiError('Unauthorized', { kind: 'http', status: 401 }),
    )
  const store = new AdminStore({ list } as unknown as AdminGateway, expire)
  await store.load('companies', {})
  await store.load('companies', {}, true)
  expect(expire).toHaveBeenCalledOnce()
  expect(store.getSnapshot().items).toEqual([])
})
it('preserves validation errors without logout or automatic mutation retry', async () => {
  const { ApiError } = await import('../../../shared/api')
  const error = new ApiError('Invalid', {
    kind: 'http',
    status: 422,
    validationErrors: { email: ['Already used'] },
  })
  const expire = vi.fn()
  const store = new AdminStore({} as AdminGateway, expire)
  const operation = vi.fn().mockRejectedValue(error)
  await expect(store.mutate(operation)).rejects.toBe(error)
  expect(store.getSnapshot().error).toBe(error)
  expect(store.getSnapshot().busy).toBe(false)
  expect(operation).toHaveBeenCalledOnce()
  expect(expire).not.toHaveBeenCalled()
})
