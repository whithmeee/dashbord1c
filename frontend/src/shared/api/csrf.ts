import { buildApiUrl } from './api-config'
import { ApiError, createHttpError } from './api-error'

export type CookieReader = (name: string) => string | undefined

type CsrfManagerOptions = {
  baseUrl: string
  fetcher: typeof fetch
  readCookie: CookieReader
}

export class CsrfManager {
  private readonly baseUrl: string
  private readonly fetcher: typeof fetch
  private readonly readCookie: CookieReader
  private bootstrapPromise: Promise<void> | undefined
  private initialized = false

  constructor(options: CsrfManagerOptions) {
    this.baseUrl = options.baseUrl
    this.fetcher = options.fetcher
    this.readCookie = options.readCookie
  }

  async token(signal?: AbortSignal): Promise<string> {
    if (!this.initialized) {
      await this.waitForBootstrap(signal)
    }

    return decodeToken(this.readCookie('XSRF-TOKEN'))
  }

  async refresh(signal?: AbortSignal): Promise<string> {
    this.initialized = false
    await this.waitForBootstrap(signal)

    return decodeToken(this.readCookie('XSRF-TOKEN'))
  }

  private waitForBootstrap(signal?: AbortSignal): Promise<void> {
    if (!this.bootstrapPromise) {
      this.bootstrapPromise = this.bootstrap().finally(() => {
        this.bootstrapPromise = undefined
      })
    }

    return waitWithoutCancelling(this.bootstrapPromise, signal)
  }

  private async bootstrap(): Promise<void> {
    let response: Response

    try {
      response = await this.fetcher(
        buildApiUrl(this.baseUrl, '/sanctum/csrf-cookie'),
        {
          credentials: 'include',
          headers: { Accept: 'application/json' },
          method: 'GET',
        },
      )
    } catch (error) {
      throw ApiError.network(error)
    }

    if (!response.ok) {
      throw await createHttpError(response)
    }

    decodeToken(this.readCookie('XSRF-TOKEN'))
    this.initialized = true
  }
}

export const readBrowserCookie: CookieReader = (name) => {
  if (typeof document === 'undefined') {
    return undefined
  }

  const prefix = `${name}=`
  const cookie = document.cookie
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix))

  return cookie?.slice(prefix.length)
}

function decodeToken(token: string | undefined): string {
  if (!token) {
    throw ApiError.csrf('CSRF cookie was not set', 'CSRF_TOKEN_MISSING')
  }

  try {
    return decodeURIComponent(token)
  } catch (error) {
    throw ApiError.csrf('CSRF cookie is malformed', 'CSRF_TOKEN_INVALID', error)
  }
}

function waitWithoutCancelling(
  promise: Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  if (!signal) {
    return promise
  }

  if (signal.aborted) {
    return Promise.reject(createAbortError())
  }

  return new Promise((resolve, reject) => {
    const abort = () => reject(createAbortError())
    signal.addEventListener('abort', abort, { once: true })
    promise.then(resolve, reject).finally(() => {
      signal.removeEventListener('abort', abort)
    })
  })
}

function createAbortError(): DOMException {
  return new DOMException('The operation was aborted', 'AbortError')
}
