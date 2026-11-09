import { ApiError } from './api-error'

const CYRILLIC_PATTERN = /\p{Script=Cyrillic}/u

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Требуется вход в систему.',
  403: 'Недостаточно прав для этого действия.',
  404: 'Не найдено.',
  409: 'Действие конфликтует с текущим состоянием.',
  419: 'Сессия устарела. Обновите страницу и повторите.',
  422: 'Проверьте введённые данные.',
  429: 'Слишком много запросов. Повторите позже.',
  502: 'Внешний сервис не отвечает. Повторите позже.',
  503: 'Сервис временно недоступен.',
}

export const GENERIC_ERROR_MESSAGE = 'Не удалось выполнить запрос. Попробуйте ещё раз.'
export const NETWORK_ERROR_MESSAGE = 'Нет связи с сервером. Проверьте подключение к интернету.'
export const CSRF_ERROR_MESSAGE = 'Сессия безопасности устарела. Обновите страницу и повторите.'
export const SERVER_ERROR_MESSAGE = 'Внутренняя ошибка сервера. Попробуйте позже.'

export function describeError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return GENERIC_ERROR_MESSAGE
  }

  switch (error.kind) {
    case 'network':
      return NETWORK_ERROR_MESSAGE
    case 'csrf':
      return CSRF_ERROR_MESSAGE
    case 'http':
      return describeHttpError(error)
  }
}

function describeHttpError(error: ApiError): string {
  const fieldMessage = Object.values(error.validationErrors ?? {}).flat()[0]

  if (fieldMessage && CYRILLIC_PATTERN.test(fieldMessage)) {
    return fieldMessage
  }

  if (CYRILLIC_PATTERN.test(error.message)) {
    return error.message
  }

  return STATUS_MESSAGES[error.status ?? 0] ?? statusClassMessage(error.status)
}

function statusClassMessage(status: number | undefined): string {
  return status !== undefined && status >= 500 ? SERVER_ERROR_MESSAGE : GENERIC_ERROR_MESSAGE
}
