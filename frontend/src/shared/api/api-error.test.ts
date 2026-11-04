import { describe, expect, it } from 'vitest'
import { ApiError, createHttpError } from './api-error'

describe('API errors', () => {
  it('preserves Laravel JSON error details', async () => {
    const response = Response.json(
      {
        message: 'The given data was invalid.',
        code: 'VALIDATION_FAILED',
        errors: { email: ['The email field is required.'] },
      },
      { status: 422 },
    )

    await expect(createHttpError(response)).resolves.toMatchObject({
      kind: 'http',
      status: 422,
      message: 'The given data was invalid.',
      code: 'VALIDATION_FAILED',
      validationErrors: { email: ['The email field is required.'] },
    })
  })

  it('uses response text for a non-JSON HTTP error', async () => {
    const response = new Response('Service unavailable', { status: 503 })

    await expect(createHttpError(response)).resolves.toMatchObject({
      status: 503,
      message: 'Service unavailable',
    })
  })

  it('represents network failures separately from HTTP failures', () => {
    const error = ApiError.network(new TypeError('Failed to fetch'))

    expect(error).toMatchObject({
      kind: 'network',
      status: undefined,
      message: 'Network request failed',
    })
  })
})
