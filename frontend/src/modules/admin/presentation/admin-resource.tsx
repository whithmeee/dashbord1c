import type { AdminGateway } from '../domain/admin-gateway'
import type { Resource } from '../domain/admin'
import { AdminError } from './admin-error'
import { AdminTable } from './admin-table'
import { AdminResourceDialogs } from './admin-resource-dialogs'
import { useAdminResource } from './use-admin-resource'

export function AdminResource({
  resource,
  gateway,
  expire,
  currentUserId,
}: {
  resource: Resource
  gateway: AdminGateway
  expire: () => void
  currentUserId: number
}) {
  const controller = useAdminResource(resource, gateway, expire)
  const { state, params, setParams, setAction, refresh } = controller
  return (
    <section>
      <form
        className="admin-toolbar"
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          setParams({
            page: '1',
            ...Object.fromEntries(
              [...data].map(([key, value]) => [key, String(value)]),
            ),
          })
        }}
      >
        {resource === 'companies' && (
          <input
            name="search"
            aria-label="Поиск компаний"
            placeholder="Название или email"
          />
        )}
        {resource === 'integrations' && (
          <input
            name="company_id"
            type="number"
            min="1"
            aria-label="ID компании"
            placeholder="ID компании"
          />
        )}
        {resource === 'users' && (
          <select name="role_id" aria-label="Фильтр роли">
            <option value="">Все роли</option>
            <option value="1">Администраторы</option>
            <option value="2">Сотрудники</option>
          </select>
        )}
        <button disabled={state.busy}>Найти</button>
        <button
          type="button"
          disabled={state.busy}
          onClick={() => setAction({ kind: 'create' })}
        >
          Добавить
        </button>
        <button
          type="button"
          disabled={state.busy || state.status === 'loading'}
          onClick={() => void refresh()}
        >
          Обновить
        </button>
      </form>
      <AdminError error={state.error} />
      {state.status === 'loading' && <p role="status">Загрузка…</p>}
      {state.status === 'success' && !state.items.length && (
        <p>Записей пока нет.</p>
      )}
      <AdminTable
        resource={resource}
        currentUserId={currentUserId}
        controller={controller}
      />
      {resource !== 'integrations' && (
        <div className="admin-toolbar">
          <button
            disabled={
              state.busy || state.status === 'loading' || state.page <= 1
            }
            onClick={() =>
              setParams({ ...params, page: String(state.page - 1) })
            }
          >
            Назад
          </button>
          <span>
            Страница {state.page} из {state.lastPage}
          </span>
          <button
            disabled={
              state.busy ||
              state.status === 'loading' ||
              state.page >= state.lastPage
            }
            onClick={() =>
              setParams({ ...params, page: String(state.page + 1) })
            }
          >
            Далее
          </button>
        </div>
      )}
      <AdminResourceDialogs
        controller={controller}
        resource={resource}
        gateway={gateway}
        currentUserId={currentUserId}
      />
    </section>
  )
}
