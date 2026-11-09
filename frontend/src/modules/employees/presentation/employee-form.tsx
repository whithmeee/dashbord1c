import { useState } from 'react'
import type { Employee } from '../domain/employee'
import { employeeSections, type EmployeeSection } from '../domain/employee'
import { Checkbox } from '../../../shared/ui/checkbox'
import { EmployeeDialog } from './employee-dialog'

export type EmployeeFormValues = {
  name: string
  position: string
  login: string
  password: string
  sections: EmployeeSection[]
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
    sections: employee?.sections ? [...employee.sections] : [...employeeSections],
  }))

  function updateField(field: keyof EmployeeFormValues, value: string): void {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function toggleSection(section: EmployeeSection, checked: boolean): void {
    setValues((current) => ({
      ...current,
      sections: checked ? [...current.sections, section] : current.sections.filter((item) => item !== section),
    }))
  }

  return (
    <EmployeeDialog
      title={employee ? 'Редактировать сотрудника' : 'Новый сотрудник'}
      description={employee ? 'Измените данные доступа и профиля.' : 'Добавьте участника команды в кабинет.'}
      testId="employee-form-dialog"
      onClose={onClose}
    >
      <form className="employees-modal" data-testid="employee-form" onSubmit={(event) => {
        event.preventDefault()
        onSubmit(values)
      }}>
        <EmployeeField label="Имя" value={values.name} required error={errors?.name} onChange={(value) => updateField('name', value)} />
        <EmployeeField label="Должность" value={values.position} required error={errors?.position} onChange={(value) => updateField('position', value)} />
        <EmployeeField label="Логин" value={values.login} required pattern="[A-Za-z0-9_-]+" error={errors?.login} onChange={(value) => updateField('login', value)} />
        <EmployeeField label={employee ? 'Новый пароль' : 'Пароль'} value={values.password} required={!employee} minLength={8} type="password" error={errors?.password} onChange={(value) => updateField('password', value)} />
        <fieldset className="employees-permissions">
          <legend>Права доступа</legend>
          <p>Выберите разделы кабинета, доступные сотруднику.</p>
          <div className="employees-permissions-grid">
            {employeeSections.map((section) => <PermissionCheckbox key={section} section={section} checked={values.sections.includes(section)} onChange={(checked) => toggleSection(section, checked)} />)}
          </div>
          {errors?.sections && errors.sections.map((message) => <small key={message} className="employees-field-error">{message}</small>)}
        </fieldset>
        <footer className="employees-modal-actions">
          <button className="cabinet-button" type="button" onClick={onClose}>Отмена</button>
          <button className="cabinet-button cabinet-button-primary" type="submit" disabled={pending}>
            {pending ? 'Сохраняем…' : employee ? 'Сохранить' : 'Добавить'}
          </button>
        </footer>
      </form>
    </EmployeeDialog>
  )
}

const sectionLabels: Record<EmployeeSection, string> = {
  finance: 'Финансовые отчёты',
  integrations: 'Синхронизация с 1С',
  statistics: 'Статистика',
  subscription: 'Подписка',
  system_status: 'Состояние системы',
  chat: 'ИИ-ассистент',
}

function PermissionCheckbox({ section, checked, onChange }: { section: EmployeeSection; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="employees-permission"><Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} /><span>{sectionLabels[section]}</span></label>
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
