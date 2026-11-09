import { ApiError, describeError } from '../../../shared/api'

export function getAuthErrorMessage(error?: Error): string {
  if (!error) {
    return ''
  }

  if (error instanceof ApiError && error.status === 429) {
    return 'Слишком много попыток. Попробуйте немного позже.'
  }

  return describeError(error)
}
