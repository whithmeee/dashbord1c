import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api'
import type { AdminGateway } from '../domain/admin-gateway'
import type { Statistics } from '../domain/admin'
import { AdminError } from './admin-error'

export function AdminStatistics({
  gateway,
  expire,
}: {
  gateway: AdminGateway
  expire: () => void
}) {
  const [params, setParams] = useState<Record<string, string>>({
    period: 'month',
  })
  const [state, setState] = useState<{
    data?: Statistics
    error?: Error
    loading: boolean
  }>({ loading: true })
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    void gateway
      .statistics(params, controller.signal)
      .then((data) => {
        if (active) setState({ data, loading: false })
      })
      .catch((error) => {
        if (!active) return
        if (error instanceof ApiError && error.status === 401) expire()
        else setState({ error, loading: false })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [gateway, params, expire])
  return (
    <section>
      <h2>Статистика запросов</h2>
      <form
        className="admin-toolbar"
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          setState({ loading: true })
          setParams(
            Object.fromEntries(
              [...form].map(([key, value]) => [key, String(value)]),
            ),
          )
        }}
      >
        <label>
          Период
          <select name="period" defaultValue="month">
            <option value="today">Сегодня</option>
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="year">Год</option>
          </select>
        </label>
        <label>
          С<input name="from" type="date" />
        </label>
        <label>
          По
          <input name="to" type="date" />
        </label>
        <label>
          Группировка
          <select name="group" defaultValue="day">
            <option value="day">День</option>
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="hour">Час (до 7 дней)</option>
          </select>
        </label>
        <label>
          Компания
          <input name="company_id" type="number" min="1" placeholder="ID" />
        </label>
        <label>
          База 1С
          <input name="integration_id" type="number" min="1" placeholder="ID" />
        </label>
        <button disabled={state.loading}>Показать</button>
      </form>
      <AdminError error={state.error} />
      {state.loading && <p role="status">Загрузка…</p>}
      {state.data && (
        <>
          <h3>Всего запросов: {state.data.total}</h3>
          <p>
            {state.data.period.from} — {state.data.period.to}
          </p>
          <StatsTable
            title="По периодам"
            rows={state.data.by_period.map((row) => ({
              name: row.period,
              requests: row.requests,
            }))}
          />
          <StatsTable title="По базам 1С" rows={state.data.by_integration} />
          <StatsTable
            title={state.data.by_author ? 'По авторам' : 'По компаниям'}
            rows={state.data.by_author ?? state.data.by_company ?? []}
          />
        </>
      )}
    </section>
  )
}
function StatsTable({
  title,
  rows,
}: {
  title: string
  rows: { name: string; requests: number }[]
}) {
  return (
    <div className="admin-table-wrap">
      <h3>{title}</h3>
      <table>
        <thead>
          <tr>
            <th>Название / период</th>
            <th>Запросы</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td>{row.name}</td>
              <td>{row.requests}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p>Нет запросов за выбранный период.</p>}
    </div>
  )
}
