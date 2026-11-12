import { describe, expect, it, vi } from 'vitest'
import { createApiClient } from './api-client'

function deferredResponse() {
  let resolve: (response: Response) => void = () => undefined
  const promise = new Promise<Response>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

describe('Sanctum CSRF', () => {
  it('bootstraps once before the first mutation and sends the decoded token', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ id: 1 }))
    const client = createApiClient({
      baseUrl: '',
      fetcher,
      readCookie: () => 'token%3Dvalue',
    })

    await client.post('/api/chats', { title: 'VAT' })

    expect(fetcher.mock.calls[0]).toEqual([
      '/sanctum/csrf-cookie',
      {
        credentials: 'include',
        headers: { Accept: 'application/json' },
        method: 'GET',
      },
    ])
    expect(fetcher.mock.calls[1][1].headers['X-XSRF-TOKEN']).toBe('token=value')
  })

  it('shares one bootstrap between concurrent mutations', async () => {
    const bootstrap = deferredResponse()
    const fetcher = vi.fn((input: RequestInfo | URL) => {
      if (String(input).endsWith('/sanctum/csrf-cookie')) {
        return bootstrap.promise
      }

      return Promise.resolve(Response.json({ saved: true }))
    })
    const client = createApiClient({ baseUrl: '', fetcher, readCookie: () => 'token' })

    const first = client.post('/api/first')
    const second = client.patch('/api/second')
    expect(fetcher).toHaveBeenCalledTimes(1)
    bootstrap.resolve(new Response(null, { status: 204 }))

    await expect(Promise.all([first, second])).resolves.toHaveLength(2)
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('refreshes CSRF after 419 and retries the mutation exactly once', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ message: 'CSRF mismatch' }, { status: 419 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ message: 'CSRF mismatch' }, { status: 419 }))
    const client = createApiClient({ baseUrl: '', fetcher, readCookie: () => 'token' })

    await expect(client.delete('/api/chats/1')).rejects.toMatchObject({ status: 419 })
    expect(fetcher).toHaveBeenCalledTimes(4)
  })

  it('does not cancel shared bootstrap when one waiter aborts', async () => {
    const bootstrap = deferredResponse()
    const fetcher = vi.fn((input: RequestInfo | URL) =>
      String(input).endsWith('/sanctum/csrf-cookie')
        ? bootstrap.promise
        : Promise.resolve(Response.json({ saved: true })),
    )
    const client = createApiClient({ baseUrl: '', fetcher, readCookie: () => 'token' })
    const controller = new AbortController()

    const cancelled = client.post('/api/cancelled', undefined, {
      signal: controller.signal,
    })
    const completed = client.post('/api/completed')
    controller.abort()
    bootstrap.resolve(new Response(null, { status: 204 }))

    await expect(cancelled).rejects.toMatchObject({ name: 'AbortError' })
    await expect(completed).resolves.toEqual({ saved: true })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('shares bootstrap failure and permits a later bootstrap attempt', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ message: 'Unavailable' }, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ saved: true }))
    const client = createApiClient({ baseUrl: '', fetcher, readCookie: () => 'token' })

    const results = await Promise.allSettled([
      client.post('/api/first'),
      client.post('/api/second'),
    ])
    expect(results.map((result) => result.status)).toEqual(['rejected', 'rejected'])

    await expect(client.post('/api/third')).resolves.toEqual({ saved: true })
    expect(fetcher).toHaveBeenCalledTimes(3)
  })
})
