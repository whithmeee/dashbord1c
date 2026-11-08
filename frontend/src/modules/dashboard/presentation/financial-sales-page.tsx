import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { RefreshCw, TrendingUp, Users } from 'lucide-react'
import { authSessionStore } from '../../auth/react/auth-runtime'
import { integrationsStore } from '../../integrations/integrations-runtime'
import { financialSalesStore } from '../financial-sales-runtime'
import type { DashboardPeriod } from '../domain/dashboard-report'
import { buildFinancialSalesView, periodToRange } from './financial-dashboard-view'
import { RevenueChart, DebtorsChart } from './charts/report-charts'
import type { SalesReport } from '../domain/financial-sales'
import './financial-sales-page.css'

const periodLabels: Record<DashboardPeriod, string> = {
  quarter: '3 месяца',
  'half-year': '6 месяцев',
}

export function FinancialSalesPage({ onBack }: { onBack: () => void }) {
  const integrations = useSyncExternalStore(
    integrationsStore.subscribe,
    integrationsStore.getSnapshot,
    integrationsStore.getSnapshot,
  )
  const sales = useSyncExternalStore(
    financialSalesStore.subscribe,
    financialSalesStore.getSnapshot,
    financialSalesStore.getSnapshot,
  )
  const session = useSyncExternalStore(
    authSessionStore.subscribe,
    authSessionStore.getSnapshot,
    authSessionStore.getSnapshot,
  )
  const reducedMotion = useReducedMotion()
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<number>()
  const period: DashboardPeriod = sales.status === 'success'
    ? periodFromRange(sales.period.from, sales.period.to)
    : 'half-year'
  const range = useMemo(() => periodToRange(period), [period])

  useEffect(() => {
    void integrationsStore.load()
  }, [])

  useEffect(() => {
    if (session.status !== 'authenticated-client') {
      financialSalesStore.reset()
    }
  }, [session])

  useEffect(() => {
    if (integrations.status !== 'success') return
    const active = integrations.items.find(
      (item) => item.isActive && item.status === 'active',
    )
    if (!active) return
    setSelectedIntegrationId((current) => current ?? active.id)
    financialSalesStore.setIntegration(active.id)
    financialSalesStore.setPeriod(range.from, range.to)
    void financialSalesStore.load()
  }, [integrations, range.from, range.to])

  const activeIntegrations = integrations.status === 'success'
    ? integrations.items.filter((item) => item.isActive && item.status === 'active')
    : []

  return (
    <section className="dashboard financial-sales-page" data-testid="financial-dashboard">
      <button className="dashboard-back" onClick={onBack} type="button">← В меню</button>
      <header className="dashboard-header">
        <div>
          <span className="application-eyebrow">Финансовые отчёты 1С</span>
          <h1>Аналитика</h1>
          <p>Реальные данные по реализациям из подключённой базы</p>
        </div>
        <button
          className="dashboard-refresh"
          onClick={() => void financialSalesStore.retry()}
          disabled={sales.status === 'loading'}
          type="button"
        >
          <RefreshCw size={16} /> Обновить
        </button>
      </header>

      <div className="financial-sales-toolbar">
        <label>
          <span>База 1С</span>
          <select
            value={selectedIntegrationId ?? ''}
            onChange={(event) => {
              const id = Number(event.target.value)
              setSelectedIntegrationId(id)
              financialSalesStore.setIntegration(id)
              void financialSalesStore.load()
            }}
            disabled={activeIntegrations.length === 0}
            data-testid="financial-integration-select"
          >
            <option value="" disabled>Выберите подключение</option>
            {activeIntegrations.map((item) => (
              <option value={item.id} key={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
        <div className="dashboard-periods" role="group" aria-label="Период отчёта">
          {(Object.keys(periodLabels) as DashboardPeriod[]).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={item === period}
              onClick={() => {
                const next = periodToRange(item)
                financialSalesStore.setPeriod(next.from, next.to)
                void financialSalesStore.load()
              }}
            >
              {periodLabels[item]}
            </button>
          ))}
        </div>
      </div>

      {integrations.status === 'loading' && <p role="status">Загружаем подключения…</p>}
      {integrations.status === 'error' && (
        <StateCard title="Не удалось загрузить подключения" action={() => void integrationsStore.retry()} />
      )}
      {integrations.status === 'success' && activeIntegrations.length === 0 && (
        <StateCard title="Нет активных подключений 1С" />
      )}
      {sales.status === 'loading' && <p role="status">Загружаем финансовый отчёт…</p>}
      {sales.status === 'error' && (
        <StateCard title="Финансовый отчёт недоступен" message={sales.error.message} action={() => void financialSalesStore.retry()} />
      )}
      {sales.status === 'success' && (
        <FinancialSalesReport report={sales.report} reducedMotion={Boolean(reducedMotion)} />
      )}
      {sales.status === 'idle' && activeIntegrations.length > 0 && <p className="financial-sales-empty">Выберите подключение, чтобы загрузить отчёт.</p>}
    </section>
  )
}

function FinancialSalesReport({ report, reducedMotion }: { report: SalesReport; reducedMotion: boolean }) {
  const view = buildFinancialSalesView(report)
  if (view.kind === 'currency-unavailable') return <StateCard title={view.message} />
  if (view.kind === 'empty') return <StateCard title="За выбранный период нет данных для отображения." />
  const scale = report.money.amountScale
  const monthly = view.monthly.map((item) => ({ label: item.period, amount: item.amountMinor / 10 ** scale }))
  const customers = view.customers.map((item) => ({ label: item.name, amount: item.amountMinor / 10 ** scale }))
  return (
    <motion.div className="dashboard-reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reducedMotion ? 0 : 0.16 }}>
      <article className="dashboard-metric">
        <span className="dashboard-metric-icon"><TrendingUp size={20} /></span>
        <span>Сумма реализаций</span>
        <strong>{formatAmount(view.totalAmountMinor, scale)} {report.money.currency}</strong>
        <small>По данным 1С за выбранный период</small>
      </article>
      <article className="dashboard-metric">
        <span className="dashboard-metric-icon"><Users size={20} /></span>
        <span>Покупатели по реализациям</span>
        <strong>{view.customers.length}</strong>
        <small>Топ покупателей, не задолженность</small>
      </article>
      <article className="dashboard-report">
        <header><h2>Сумма реализаций по месяцам</h2><p>Валюта: {report.money.currency}</p></header>
        <RevenueChart points={monthly} />
      </article>
      <article className="dashboard-report">
        <header><h2>Покупатели по реализациям</h2><p>Валюта: {report.money.currency}</p></header>
        <DebtorsChart points={customers} />
      </article>
    </motion.div>
  )
}

function StateCard({ title, message, action }: { title: string; message?: string; action?: () => void }) {
  return <div className="dashboard-state" role={message ? 'alert' : undefined}><h2>{title}</h2>{message && <p>{message}</p>}{action && <button className="dashboard-refresh" type="button" onClick={action}>Повторить</button>}</div>
}

function formatAmount(amountMinor: number, scale: number): string {
  return (amountMinor / 10 ** scale).toLocaleString('ru-RU', { minimumFractionDigits: scale, maximumFractionDigits: scale })
}

function periodFromRange(from: string, to: string): DashboardPeriod {
  const start = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)
  const months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth() + 1
  return months <= 3 ? 'quarter' : 'half-year'
}
