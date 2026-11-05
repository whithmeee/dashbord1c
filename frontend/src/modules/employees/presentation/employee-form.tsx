import { useState } from 'react'
import { X } from 'lucide-react'
import type { Employee } from '../domain/employee'

export type EmployeeFormValues = {
  name: string
  position: string
  login: string
  password: string
}

export function EmployeeForm({
  employee,
  pending,
  errors,
  onSubmit,
  onClose,
}: {
  employee?: Employee
  pending: boolean
  errors?: Record<string, string[]>
  onSubmit: (values: EmployeeFormValues) => void
  onClose: () => void
}) {
  const [values, setValues] = useState<EmployeeFormValues>(() => ({
    name: employee?.name ?? '',
    position: employee?.position ?? '',
    login: employee?.login ?? '',
    password: '',
  }))

  function updateField(field: keyof EmployeeFormValues, value: string): void {
    setValues((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="employees-overlay" role="presentation">
      <form className="employees-modal" data-testid="employee-form" onSubmit={(event) => {
        event.preventDefault()
        onSubmit(values)
      }}>
        <header className="employees-modal-header">
          <div>
            <h3>{employee ? 'Редактировать сотрудника' : 'Новый сотрудник'}</h3>
            <p>{employee ? 'Измените данные доступа и профиля.' : 'Добавьте участника команды в кабинет.'}</p>
          </div>
          <button className="employees-icon-button" type="button" aria-label="Закрыть" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <EmployeeField label="Имя" value={values.name} required error={errors?.name} onChange={(value) => updateField('name', value)} />
        <EmployeeField label="Должность" value={values.position} required error={errors?.position} onChange={(value) => updateField('position', value)} />
        <EmployeeField label="Логин" value={values.login} required pattern="[A-Za-z0-9_-]+" error={errors?.login} onChange={(value) => updateField('login', value)} />
        <EmployeeField label={employee ? 'Новый пароль' : 'Пароль'} value={values.password} required={!employee} minLength={8} type="password" error={errors?.password} onChange={(value) => updateField('password', value)} />
        <footer className="employees-modal-actions">
          <button className="cabinet-button" type="button" onClick={onClose}>Отмена</button>
          <button className="cabinet-button cabinet-button-primary" type="submit" disabled={pending}>
            {pending ? 'Сохраняем…' : employee ? 'Сохранить' : 'Добавить'}
          </button>
        </footer>
      </form>
    </div>
  )
}

function EmployeeField({
  label,
  value,
  error,
  onChange,
  ...inputProps
}: {
  label: string
  value: string
  error?: string[]
  onChange: (value: string) => void
  required?: boolean
  pattern?: string
  minLength?: number
  type?: string
}) {
  return (
    <label className="employees-field">
      <span>{label}</span>
      <input {...inputProps} value={value} onChange={(event) => onChange(event.target.value)} />
      {error?.map((message) => <small key={message} className="employees-field-error">{message}</small>)}
    </label>
  )
}
