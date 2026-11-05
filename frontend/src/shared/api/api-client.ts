import { buildApiUrl, resolveApiBaseUrl } from './api-config'
import { ApiError, createHttpError } from './api-error'
import { CsrfManager, readBrowserCookie, type CookieReader } from './csrf'

export type RequestOptions = {
  signal?: AbortSignal
}

export type ApiClient = {
  get<Response>(path: string, options?: RequestOptions): Promise<Response>
  post<Response>(path: string, body?: unknown, options?: RequestOptions): Promise<Response>
  patch<Response>(path: string, body?: unknown, options?: RequestOptions): Promise<Response>
  delete<Response = undefined>(path: string, options?: RequestOptions): Promise<Response>
}

export type ApiClientOptions = {
  baseUrl?: string
  fetcher?: typeof fetch
  readCookie?: CookieReader
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const baseUrl = resolveApiBaseUrl(
    options.baseUrl ?? import.meta.env.VITE_API_BASE_URL,
  )
  const fetcher = (options.fetcher ?? globalThis.fetch).bind(globalThis)
  const csrf = new CsrfManager({
    baseUrl,
    fetcher,
    readCookie: options.readCookie ?? readBrowserCookie,
  })

  async function request<Response>(
    method: HttpMethod,
    path: string,
    body: unknown,
    requestOptions: RequestOptions,
  ): Promise<Response> {
    if (method === 'GET') {
      return execute(method, path, body, requestOptions)
    }

    let csrfToken = await csrf.token(requestOptions.signal)

    try {
      return await execute(method, path, body, requestOptions, csrfToken)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 419) {
        throw error
      }

      csrfToken = await csrf.refresh(requestOptions.signal)

      return execute(method, path, body, requestOptions, csrfToken)
    }
  }

  async function execute<Response>(
    method: HttpMethod,
    path: string,
    body: unknown,
    requestOptions: RequestOptions,
    csrfToken?: string,
  ): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json' }
    const init: RequestInit = {
      credentials: 'include',
      headers,
      method,
      signal: requestOptions.signal,
    }

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
      init.body = JSON.stringify(body)
    }

    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken
    }

    let response: globalThis.Response

    try {
      response = await fetcher(buildApiUrl(baseUrl, path), init)
    } catch (error) {
      if (requestOptions.signal?.aborted) {
        throw error
      }

      throw ApiError.network(error)
    }

    if (!response.ok) {
      throw await createHttpError(response)
    }

    return readResponse<Response>(response)
  }

  return {
    get: (path, requestOptions = {}) =>
      request('GET', path, undefined, requestOptions),
    post: (path, body, requestOptions = {}) =>
      request('POST', path, body, requestOptions),
    patch: (path, body, requestOptions = {}) =>
      request('PATCH', path, body, requestOptions),
    delete: (path, requestOptions = {}) =>
      request('DELETE', path, undefined, requestOptions),
  }
}

async function readResponse<Response>(response: globalThis.Response): Promise<Response> {
  if (response.status === 204) {
    return undefined as Response
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return (await response.json()) as Response
  }

  return (await response.text()) as Response
}
