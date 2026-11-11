import { Contacts } from './admin-contacts'
import { changedFields } from '../domain/changed-fields'
import { useState, type FormEvent } from 'react'
import type {
  AdminRecord,
  CompanyOption,
  Input,
  Resource,
} from '../domain/admin'

export function AdminForm({
  resource,
  item,
  busy,
  onSubmit,
  currentUserId,
  companies = [],
  companiesFailed = false,
}: {
  resource: Resource
  item?: AdminRecord
  busy: boolean
  onSubmit: (input: Input) => void
  currentUserId: number
  companies?: CompanyOption[]
  companiesFailed?: boolean
}) {
  const initial: Input =
    resource === 'companies'
      ? {
          name: item?.name ?? '',
          email: item?.email ?? '',
          subscription_starts_at: item?.subscription_starts_at ?? '',
          subscription_ends_at: item?.subscription_ends_at ?? '',
          ...(item ? {} : { verified: false }),
          phones: item?.phones ?? [],
          messengers: item?.messengers ?? [],
        }
      : resource === 'users'
        ? {
            name: item?.name ?? '',
            email: item?.email ?? '',
            phone_number: item?.phone_number ?? '',
            role_id: item?.role?.id ?? 2,
          }
        : {
            name: item?.name ?? '',
            company_id: item?.company_id ?? '',
            config_name: item?.config_name ?? '',
            odata_url: item?.odata_url ?? '',
            login: item?.login ?? '',
            password: '',
            ...(item ? { is_active: item.is_active } : {}),
          }
  const [values, setValues] = useState(initial)
  const [visible, setVisible] = useState(false)
  const set = (key: string, value: unknown) =>
    setValues((previous) => ({ ...previous, [key]: value }))
  function submit(event: FormEvent) {
    event.preventDefault()
    const input = { ...values }
    if (resource === 'integrations') {
      if (item) delete input.company_id
      else input.company_id = Number(input.company_id)
      if (!input.name) delete input.name
    }
    onSubmit(item ? changedFields(input, initial) : input)
  }
  const fields =
    resource === 'companies'
      ? [
          ['name', 'Компания', 'text'],
          ['email', 'Email', 'email'],
          ['subscription_starts_at', 'Начало подписки', 'date'],
          ['subscription_ends_at', 'Конец подписки', 'date'],
        ]
      : resource === 'users'
        ? [
            ['name', 'Имя', 'text'],
            ['email', 'Email', 'email'],
            ['phone_number', 'Телефон', 'tel'],
          ]
        : [
                        ['name', 'Название базы', 'text'],
            ['config_name', 'Конфигурация', 'text'],
            ['odata_url', 'OData URL', 'url'],
            ['login', 'Логин 1С', 'text'],
            [
              'password',
              item ? 'Новый пароль 1С (необязательно)' : 'Пароль 1С',
              visible ? 'text' : 'password',
            ],
          ]
  return (
    <form className="admin-form" onSubmit={submit}>
      <fieldset disabled={busy}>
        {resource === 'integrations' && !item && (
          <label>
            Компания
            <select
              name="company_id"
              value={String(values.company_id ?? '')}
              onChange={(event) => set('company_id', event.target.value)}
              required
            >
              <option value="" disabled>
                {companiesFailed
                  ? 'Не удалось загрузить компании'
                  : 'Выберите компанию'}
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {fields.map(([key, label, type]) => (
          <label key={key}>
            {label}
            <input
              name={key}
              type={type}
              value={String(values[key] ?? '')}
              onChange={(event) => set(key, event.target.value)}
              required={
                !['phone_number', 'config_name'].includes(key) &&
                !(
                  resource === 'integrations' &&
                  (key === 'name' || (key === 'password' && !!item))
                )
              }
              min={type === 'number' ? 1 : undefined}
              autoComplete={key === 'password' ? 'new-password' : 'off'}
            />
          </label>
        ))}
        {resource === 'integrations' && (
          <label className="admin-inline">
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) => setVisible(event.target.checked)}
            />
            Показать пароль
          </label>
        )}
        {resource === 'integrations' && item && (
          <label className="admin-inline">
            <input
              type="checkbox"
              checked={!!values.is_active}
              onChange={(event) => set('is_active', event.target.checked)}
            />
            База активна
          </label>
        )}
        {resource === 'users' && (
          <label>
            Роль
            <select
              value={Number(values.role_id)}
              disabled={item?.id === currentUserId}
              onChange={(event) => set('role_id', Number(event.target.value))}
            >
              <option value={2}>Сотрудник администрации</option>
              <option value={1}>Администратор</option>
            </select>
          </label>
        )}
        {resource === 'companies' && !item && (
          <label className="admin-inline">
            <input
              type="checkbox"
              checked={!!values.verified}
              onChange={(event) => set('verified', event.target.checked)}
            />
            Верифицирован
          </label>
        )}
        {resource === 'companies' && (
          <>
            <Contacts kind="phones" values={values} set={set} />
            <Contacts kind="messengers" values={values} set={set} />
          </>
        )}
        <button type="submit">{busy ? 'Сохранение…' : 'Сохранить'}</button>
      </fieldset>
    </form>
  )
}
