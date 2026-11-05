import { useEffect, useState, useSyncExternalStore } from 'react'
import { AlertCircle, LoaderCircle, Pencil, Plus, RotateCcw, Trash2, Users } from 'lucide-react'
import { ApiError } from '../../../shared/api'
import { motion } from 'motion/react'
import { useInterfaceMotion } from '../../../shared/motion/use-interface-motion'
import { employeesStore } from '../employees-runtime'
import type { Employee } from '../domain/employee'
import { EmployeeForm, type EmployeeFormValues } from './employee-form'
import { DeleteEmployeeDialog } from './delete-employee-dialog'
import { buildEmployeeUpdateInput } from './users-page-helpers'
import './users.css'

export function UsersPage({ canManage }: { canManage: boolean }) {
  const state = useSyncExternalStore(employeesStore.subscribe, employeesStore.getSnapshot, employeesStore.getSnapshot)
  const { appearance } = useInterfaceMotion()
  const [form, setForm] = useStateForm()

  useEffect(() => {
    if (canManage) void employeesStore.load()
  }, [canManage])

  if (!canManage) {
    return <section className="employees-page employees-forbidden" data-testid="employees-forbidden"><Users size={30} /><h2>Раздел недоступен</h2><p>Управлять пользователями может только владелец компании.</p></section>
  }

  if (state.status === 'idle' || state.status === 'loading') {
    return <section className="employees-page employees-state" data-testid="employees-loading"><LoaderCircle className="employees-spinner" size={28} /><h2>Загружаем пользователей</h2><p>Получаем список сотрудников.</p></section>
  }

  if (state.status === 'error') {
    return <section className="employees-page employees-state" data-testid="employees-error"><AlertCircle size={28} /><h2>Не удалось загрузить пользователей</h2><p>{getErrorMessage(state.error)}</p><button className="cabinet-button cabinet-button-primary" type="button" onClick={() => void employeesStore.retry()}><RotateCcw size={16} />Повторить</button></section>
  }

  const mutation = state.mutation
  const mutationError = mutation?.status === 'error' ? mutation : undefined
  const pending = mutation?.status === 'pending'
  const editing = form.mode === 'edit' ? state.employees.find((item) => item.id === form.employeeId) : undefined
  const deleting = form.mode === 'delete' ? state.employees.find((item) => item.id === form.employeeId) : undefined

  async function submit(values: EmployeeFormValues): Promise<void> {
    if (form.mode === 'create') {
      await employeesStore.create(values)
    } else if (editing) {
      await employeesStore.update(editing.id, buildEmployeeUpdateInput(editing, values))
    }
    if (employeesStore.getSnapshot().mutation?.status !== 'error') setForm({ mode: 'closed' })
  }

  async function confirmDelete(): Promise<void> {
    if (!deleting) return
    await employeesStore.remove(deleting.id)
    if (employeesStore.getSnapshot().mutation?.status !== 'error') setForm({ mode: 'closed' })
  }

  return (
    <section className="employees-page" data-testid="employees-page">
      <header className="employees-heading"><div><h2>Пользователи и права</h2><p>Управляйте доступом сотрудников к кабинету.</p></div><button className="cabinet-button cabinet-button-primary" type="button" onClick={() => setForm({ mode: 'create' })}><Plus size={16} />Добавить сотрудника</button></header>
      {state.employees.length === 0 ? <EmployeesEmpty onAdd={() => setForm({ mode: 'create' })} /> : <div className="employees-list">{state.employees.map((employee, index) => <EmployeeCard key={employee.id} employee={employee} appearance={appearance} index={index} onEdit={() => setForm({ mode: 'edit', employeeId: employee.id })} onDelete={() => setForm({ mode: 'delete', employeeId: employee.id })} />)}</div>}
      {mutationError && <p className="employees-operation-error" role="alert">{getErrorMessage(mutationError.error)}</p>}
      {form.mode === 'create' && <EmployeeForm pending={pending === true} errors={mutationError?.operation === 'create' ? mutationError.validationErrors : undefined} onSubmit={(values) => void submit(values)} onClose={() => setForm({ mode: 'closed' })} />}
      {form.mode === 'edit' && editing && <EmployeeForm employee={editing} pending={pending === true} errors={mutationError?.operation === 'update' ? mutationError.validationErrors : undefined} onSubmit={(values) => void submit(values)} onClose={() => setForm({ mode: 'closed' })} />}
      {form.mode === 'delete' && deleting && <DeleteEmployeeDialog employee={deleting} pending={pending === true} onConfirm={() => void confirmDelete()} onClose={() => setForm({ mode: 'closed' })} />}
    </section>
  )
}

function EmployeeCard({ employee, appearance, index, onEdit, onDelete }: { employee: Employee; appearance: ReturnType<typeof useInterfaceMotion>['appearance']; index: number; onEdit: () => void; onDelete: () => void }) {
  return <motion.div className="employees-card" data-testid={`employee-${employee.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...appearance, delay: index * 0.04 }}><div className={`employees-status-dot${employee.isOnline ? ' employees-status-online' : ''}`} aria-label={employee.isOnline ? 'Онлайн' : 'Не в сети'} /><div className="employees-card-main"><div className="employees-card-title"><div><h3>{employee.name}</h3><p>{employee.position} · {employee.login}</p></div><span className={`employees-status${employee.isOnline ? ' employees-status-online' : ''}`}>{employee.isOnline ? 'Онлайн' : 'Не в сети'}</span></div>{employee.lastSeenAt && <time dateTime={employee.lastSeenAt}>Последняя активность: {formatLastSeen(employee.lastSeenAt)}</time>}</div><div className="employees-card-actions"><button className="employees-icon-button" type="button" aria-label={`Редактировать ${employee.name}`} onClick={onEdit}><Pencil size={16} /></button><button className="employees-icon-button employees-danger-icon" type="button" aria-label={`Удалить ${employee.name}`} onClick={onDelete}><Trash2 size={16} /></button></div></motion.div>
}

function EmployeesEmpty({ onAdd }: { onAdd: () => void }) { return <div className="employees-empty" data-testid="employees-empty"><Users size={30} /><h2>Сотрудников пока нет</h2><p>Добавьте первого сотрудника, чтобы предоставить доступ к кабинету.</p><button className="cabinet-button cabinet-button-primary" type="button" onClick={onAdd}><Plus size={16} />Добавить сотрудника</button></div> }
function formatLastSeen(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(date) }
function getErrorMessage(error: Error): string { if (error instanceof ApiError && error.status === 403) return 'У вас нет прав для этого действия.'; if (error instanceof ApiError && error.status === 404) return 'Сотрудник не найден или уже удалён.'; if (error instanceof ApiError && error.kind === 'network') return 'Сервер временно недоступен.'; return error.message || 'Попробуйте ещё раз.' }

type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit' | 'delete'; employeeId: number }
function useStateForm(): [FormState, (next: FormState) => void] { const [state, setState] = useState<FormState>({ mode: 'closed' }); return [state, setState] }
