import { describe, expect, it } from 'vitest'
import { ApiError, createHttpError } from './api-error'
import {
  CSRF_ERROR_MESSAGE,
  describeError,
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  SERVER_ERROR_MESSAGE,
} from './api-error-message'

async function httpError(body: BodyInit | object, status: number): Promise<ApiError> {
  const response = typeof body === 'string'
    ? new Response(body, { status })
    : Response.json(body, { status })

  return createHttpError(response)
}

describe('describeError', () => {
  it('keeps a Russian message sent by the backend', async () => {
    const error = await httpError({ message: 'Подписка компании неактивна.', code: 'subscription_inactive' }, 403)

    expect(describeError(error)).toBe('Подписка компании неактивна.')
  })

  it('prefers the first Russian validation message', async () => {
    const error = await httpError({
      message: 'Неверный логин или пароль.',
      errors: { login: ['Поле логин обязательно для заполнения.'] },
    }, 422)

    expect(describeError(error)).toBe('Поле логин обязательно для заполнения.')
  })

  it('replaces an English backend message with a Russian one for the status', async () => {
    const error = await httpError({ message: 'Server Error' }, 429)

    expect(describeError(error)).toBe('Слишком много запросов. Повторите позже.')
  })

  it('replaces English text of a non-JSON error page', async () => {
    expect(describeError(await httpError('Bad Gateway', 502))).toBe('Внешний сервис не отвечает. Повторите позже.')
    expect(describeError(await httpError('Gateway Timeout', 504))).toBe(SERVER_ERROR_MESSAGE)
  })

  it('falls back to a generic message for an unknown client status', async () => {
    expect(describeError(await httpError('Teapot', 418))).toBe(GENERIC_ERROR_MESSAGE)
  })

  it('describes network and csrf failures in Russian', () => {
    expect(describeError(ApiError.network(new TypeError('Failed to fetch')))).toBe(NETWORK_ERROR_MESSAGE)
    expect(describeError(ApiError.csrf('CSRF cookie was not set', 'CSRF_TOKEN_MISSING'))).toBe(CSRF_ERROR_MESSAGE)
  })

  it('never leaks the text of a non-API error', () => {
    expect(describeError(new Error('employee.id must be an integer'))).toBe(GENERIC_ERROR_MESSAGE)
    expect(describeError(undefined)).toBe(GENERIC_ERROR_MESSAGE)
  })
})
