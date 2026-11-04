export type ApiErrorKind = 'http' | 'network' | 'csrf'

export type ValidationErrors = Record<string, string[]>

type ApiErrorDetails = {
  kind: ApiErrorKind
  status?: number
  code?: string
  validationErrors?: ValidationErrors
  cause?: unknown
}

type ErrorPayload = {
  message?: unknown
  code?: unknown
  errors?: unknown
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | undefined
  readonly code: string | undefined
  readonly validationErrors: ValidationErrors | undefined

  constructor(message: string, details: ApiErrorDetails) {
    super(message, { cause: details.cause })
    this.name = 'ApiError'
    this.kind = details.kind
    this.status = details.status
    this.code = details.code
    this.validationErrors = details.validationErrors
  }

  static network(cause: unknown): ApiError {
    return new ApiError('Network request failed', {
      kind: 'network',
      cause,
    })
  }

  static csrf(message: string, code: string, cause?: unknown): ApiError {
    return new ApiError(message, {
      kind: 'csrf',
      code,
      cause,
    })
  }
}

export async function createHttpError(response: Response): Promise<ApiError> {
  const payload = await readErrorPayload(response)

  return new ApiError(payload.message, {
    kind: 'http',
    status: response.status,
    code: payload.code,
    validationErrors: payload.validationErrors,
  })
}

async function readErrorPayload(response: Response): Promise<{
  message: string
  code?: string
  validationErrors?: ValidationErrors
}> {
  const fallback = response.statusText || `Request failed with status ${response.status}`
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    const text = await response.text()

    return { message: text || fallback }
  }

  try {
    const payload = (await response.json()) as ErrorPayload

    return {
      message: typeof payload.message === 'string' ? payload.message : fallback,
      code: typeof payload.code === 'string' ? payload.code : undefined,
      validationErrors: readValidationErrors(payload.errors),
    }
  } catch {
    return { message: fallback }
  }
}

function readValidationErrors(value: unknown): ValidationErrors | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }

  const entries = Object.entries(value).filter(
    (entry): entry is [string, string[]] =>
      Array.isArray(entry[1]) && entry[1].every((item) => typeof item === 'string'),
  )

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}
