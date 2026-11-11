import { ApiError } from '../../../shared/api'

export function AdminError({ error }: { error?: Error }) {
  if (!error) return null
  let message =
    'Не удалось выполнить запрос. Обновите данные перед повторным действием: результат операции на сервере может быть неизвестен.'
  if (error instanceof ApiError) {
    if (error.status === 403 || error.status === 404)
      message = 'Объект не найден или доступ запрещён.'
    if (error.status === 422)
      message =
        'Проверьте поля формы. Нельзя удалить свою учётную запись или снять с себя роль администратора.'
    if (error.status === 429)
      message = 'Слишком много запросов. Попробуйте позже.'
  }
  return (
    <div role="alert" className="admin-error">
      {message}
      {error instanceof ApiError && error.validationErrors && (
        <ul>
          {Object.entries(error.validationErrors).map(([field, errors]) => (
            <li key={field}>
              {field}: {errors.join(' ')}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
