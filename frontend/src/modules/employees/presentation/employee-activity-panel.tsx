import { AlertCircle, LoaderCircle } from 'lucide-react'
import { describeError } from '../../../shared/api'
import type { EmployeeActivityState } from '../application/employee-activity-store'
import type { EmployeeActivityItem } from '../domain/employee-activity'

export function EmployeeActivityPanel({ state, employeeName }: { state: EmployeeActivityState; employeeName: string }) {
  return <section className="employees-activity" data-testid="employee-activity"><header><h4>Активность: {employeeName}</h4>{state.status === 'success' && <span>{state.profile.questionsCount} вопросов</span>}</header>{state.status === 'loading' && <div className="employees-activity-state"><LoaderCircle className="employees-spinner" size={18} />Загружаем историю</div>}{state.status === 'error' && <div className="employees-activity-state"><AlertCircle size={18} />{describeError(state.error)}</div>}{state.status === 'success' && <><dl className="employees-activity-facts"><div><dt>Последний вход</dt><dd>{formatDate(state.profile.lastLoginAt)}</dd></div><div><dt>Последний выход</dt><dd>{formatDate(state.profile.lastLogoutAt)}</dd></div></dl>{state.profile.items.length === 0 ? <p className="employees-activity-empty">История пока пуста.</p> : <ul>{state.profile.items.map((item, index) => <ActivityItem key={`${item.at}-${item.type}-${index}`} item={item} />)}</ul>}</>}</section>
}

function ActivityItem({ item }: { item: EmployeeActivityItem }) {
  const labels = { login: 'Вход в кабинет', logout: 'Выход из кабинета', question: 'Вопрос ассистенту' }
  return <li><span>{labels[item.type]}</span><time dateTime={item.at}>{formatDate(item.at)}</time>{item.details && <p>{item.details}</p>}</li>
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
