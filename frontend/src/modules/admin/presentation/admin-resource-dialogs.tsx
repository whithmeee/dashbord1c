import type { AdminGateway } from '../domain/admin-gateway'
import type { Resource } from '../domain/admin'
import type { ResourceController } from './use-admin-resource'
import { AdminDialog } from './admin-dialog'
import { AdminError } from './admin-error'
import { AdminForm } from './admin-form'
import { useCompanyOptions } from './use-company-options'

export function AdminResourceDialogs({
  controller,
  resource,
  gateway,
  currentUserId,
}: {
  controller: ResourceController
  resource: Resource
  gateway: AdminGateway
  currentUserId: number
}) {
  const { state, action, setAction, secret, setSecret, info, setInfo, run } =
    controller
  const creatingIntegration =
    resource === 'integrations' && action?.kind === 'create'
  const { companies, failed } = useCompanyOptions(
    gateway,
    creatingIntegration,
  )
  return (
    <>
      {action && (
        <AdminDialog
          title={action.kind === 'create' ? 'Новая запись' : action.item.name}
          busy={state.busy}
          onClose={() => setAction(undefined)}
        >
          <AdminError error={state.error} />
          {action.kind === 'create' || action.kind === 'edit' ? (
            <AdminForm
              resource={resource}
              item={action.kind === 'edit' ? action.item : undefined}
              currentUserId={currentUserId}
              companies={companies}
              companiesFailed={failed}
              busy={state.busy}
              onSubmit={(input) =>
                void run(
                  () =>
                    action.kind === 'create'
                      ? gateway.create(resource, input)
                      : gateway.update(resource, action.item.id, input),
                  true,
                )
              }
            />
          ) : (
            <>
              <p>
                {action.kind === 'delete'
                  ? 'Удалить запись и связанные с ней данные? Отменить удаление невозможно.'
                  : 'Выдать новый пароль? Старый пароль и старые сессии перестанут работать.'}
              </p>
              <button
                disabled={state.busy}
                onClick={() =>
                  void run(
                    () =>
                      action.kind === 'delete'
                        ? gateway.remove(resource, action.item.id)
                        : gateway.resetPassword(
                            resource as 'companies' | 'users',
                            action.item.id,
                          ),
                    true,
                  )
                }
              >
                Подтвердить
              </button>
            </>
          )}
        </AdminDialog>
      )}
      {secret && (
        <AdminDialog title="Новый пароль" onClose={() => setSecret(undefined)}>
          <p>
            Сохраните пароль и передайте владельцу безопасным способом. После
            закрытия он больше не отображается.
          </p>
          <output className="admin-secret">{secret}</output>
        </AdminDialog>
      )}
      {info && (
        <AdminDialog title={info.title} onClose={() => setInfo(undefined)}>
          {info.rows.length ? (
            <ul>
              {info.rows.map((row, index) => (
                <li key={index}>{row}</li>
              ))}
            </ul>
          ) : (
            <p>Сотрудников пока нет.</p>
          )}
        </AdminDialog>
      )}
    </>
  )
}
