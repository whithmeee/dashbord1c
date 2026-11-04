import { ApiError } from '../../../shared/api'

export function getAuthErrorMessage(error?: Error): string {
  if (!error) {
    return ''
  }
  if (!(error instanceof ApiError)) {
    return 'Не удалось выполнить запрос. Попробуйте ещё раз.'
  }
  const fieldMessage = error.validationErrors
    ? Object.values(error.validationErrors).flat()[0]
    : undefined
  if (fieldMessage) {
    return fieldMessage
  }
  if (error.status === 429) {
    return 'Слишком много попыток. Попробуйте немного позже.'
  }
  if (error.kind === 'network') {
    return 'Нет связи с сервером. Проверьте подключение к интернету.'
  }

  return error.message
}
