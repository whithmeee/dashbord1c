import type { Resource } from '../domain/admin'
import type { ResourceController } from './use-admin-resource'

export function AdminTable({
  resource,
  currentUserId,
  controller,
}: {
  resource: Resource
  currentUserId: number
  controller: ResourceController
}) {
  const { state, edit, employees, test, setAction } = controller
  return (
    <div className="admin-table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Название / имя</th>
            <th>Сведения</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {state.items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name || 'Без названия'}</td>
              <td>
                {resource === 'integrations'
                  ? `Компания #${item.company_id} · ${item.is_active ? 'Активна' : 'Отключена'} · ${item.config_name ?? ''}`
                  : item.email}
                {resource === 'users' && <div>{item.role?.label}</div>}
                {resource === 'companies' && (
                  <div>
                    Подписка:{' '}
                    {item.subscription_status === 'active'
                      ? 'активна'
                      : 'неактивна'}
                  </div>
                )}
              </td>
              <td>
                <div className="admin-actions">
                  <button disabled={state.busy} onClick={() => edit(item)}>
                    Изменить
                  </button>
                  {resource === 'companies' && (
                    <button
                      disabled={state.busy}
                      onClick={() => employees(item)}
                    >
                      Сотрудники
                    </button>
                  )}
                  {resource === 'integrations' ? (
                    <button disabled={state.busy} onClick={() => test(item)}>
                      Проверить 1С
                    </button>
                  ) : (
                    <button
                      disabled={state.busy}
                      onClick={() => setAction({ kind: 'reset', item })}
                    >
                      Сбросить пароль
                    </button>
                  )}
                  <button
                    disabled={
                      state.busy ||
                      (resource === 'users' && item.id === currentUserId)
                    }
                    onClick={() => setAction({ kind: 'delete', item })}
                  >
                    Удалить
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
