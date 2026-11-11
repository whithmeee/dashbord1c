import type { Input } from '../domain/admin'

export function Contacts({
  kind,
  values,
  set,
}: {
  kind: 'phones' | 'messengers'
  values: Input
  set: (key: string, value: unknown) => void
}) {
  const items = values[kind] as Record<string, string>[]
  const fields =
    kind === 'phones'
      ? [
          ['phone', 'Телефон'],
          ['label', 'Описание'],
        ]
      : [
          ['name', 'Мессенджер'],
          ['contact', 'Контакт'],
        ]
  return (
    <div>
      <h3>{kind === 'phones' ? 'Телефоны' : 'Мессенджеры'}</h3>
      {items.map((item, index) => (
        <div className="admin-contact" key={index}>
          {fields.map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                value={item[key] ?? ''}
                required={key !== 'label'}
                onChange={(event) =>
                  set(
                    kind,
                    items.map((entry, i) =>
                      i === index
                        ? { ...entry, [key]: event.target.value }
                        : entry,
                    ),
                  )
                }
              />
            </label>
          ))}
          <button
            type="button"
            onClick={() =>
              set(
                kind,
                items.filter((_, i) => i !== index),
              )
            }
          >
            Убрать
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          set(kind, [
            ...items,
            Object.fromEntries(fields.map(([key]) => [key, ''])),
          ])
        }
      >
        Добавить контакт
      </button>
    </div>
  )
}
