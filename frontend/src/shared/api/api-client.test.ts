import { describe, expect, it, vi } from 'vitest'
import { createApiClient } from './api-client'
import { ApiError } from './api-error'

describe('API client transport', () => {
  it('invokes the default fetch with globalThis as its receiver', async () => {
    const originalFetch = globalThis.fetch
    const fetch = function (this: unknown) {
      expect(this).toBe(globalThis)
      return Promise.resolve(Response.json({ ok: true }))
    }
    globalThis.fetch = fetch as typeof globalThis.fetch

    try {
      const client = createApiClient({ baseUrl: 'http://127.0.0.1:56331' })

      await expect(client.get('/health')).resolves.toEqual({ ok: true })
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('sends GET requests with cookies and parses JSON', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ id: 7 }))
    const client = createApiClient({ fetcher })

    await expect(client.get<{ id: number }>('/api/chats/7')).resolves.toEqual({
      id: 7,
    })
    expect(fetcher).toHaveBeenCalledWith('/api/chats/7', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      method: 'GET',
      signal: undefined,
    })
  })

  it('returns undefined for a 204 response', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    const client = createApiClient({ fetcher })

    await expect(client.get('/api/empty')).resolves.toBeUndefined()
  })

  it.each([
    ['post', 'POST'],
    ['patch', 'PATCH'],
  ] as const)('sends JSON with %s requests', async (method, httpMethod) => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ saved: true }))
    const client = createApiClient({
      fetcher,
      readCookie: () => 'csrf-token',
    })

    await client[method]('/api/chats', { title: 'October' })

    expect(fetcher).toHaveBeenLastCalledWith('/api/chats', {
      body: JSON.stringify({ title: 'October' }),
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'csrf-token',
      },
      method: httpMethod,
      signal: undefined,
    })
  })

  it('passes AbortSignal to fetch', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ ok: true }))
    const client = createApiClient({ fetcher })
    const controller = new AbortController()

    await client.get('/api/chats', { signal: controller.signal })

    expect(fetcher.mock.calls[0][1].signal).toBe(controller.signal)
  })

  it('wraps network failures without retrying', async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    const client = createApiClient({ fetcher })

    await expect(client.get('/api/chats')).rejects.toBeInstanceOf(ApiError)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('throws a typed HTTP error without retrying', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({ message: 'Unauthenticated.' }, { status: 401 }),
    )
    const client = createApiClient({ fetcher })

    await expect(client.get('/auth/me')).rejects.toMatchObject({
      kind: 'http',
      status: 401,
      message: 'Unauthenticated.',
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
