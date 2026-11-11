import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { RefreshCw } from 'lucide-react'
import { describeError } from '../../../shared/api'
import { authSessionStore } from '../../auth/react/auth-runtime'
import { integrationsStore } from '../../integrations/integrations-runtime'
import { financialSalesStore } from '../financial-sales-runtime'
import { AnalyticsCatalog, AnalyticsOverview } from './real-analytics-views'
import './page/dashboard.css'
import './page/dashboard-overview.css'
import './reports/dashboard-reports.css'
import './financial-sales-page.css'

export type AnalyticsView = 'overview' | 'catalog'

export function FinancialSalesPage({
  view,
  navigation,
}: {
  view: AnalyticsView
  navigation: ReactNode
}) {
  const integrations = useSyncExternalStore(integrationsStore.subscribe, integrationsStore.getSnapshot, integrationsStore.getSnapshot)
  const sales = useSyncExternalStore(financialSalesStore.subscribe, financialSalesStore.getSnapshot, financialSalesStore.getSnapshot)
  const session = useSyncExternalStore(authSessionStore.subscribe, authSessionStore.getSnapshot, authSessionStore.getSnapshot)
  const reducedMotion = useReducedMotion()
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<number>()
  const [months, setMonths] = useState<3 | 6>(6)

  useEffect(() => { void integrationsStore.load() }, [])
  useEffect(() => {
    if (session.status !== 'authenticated-client') financialSalesStore.reset()
  }, [session])
  useEffect(() => {
    if (integrations.status !== 'success') return
    const activeItems = integrations.items.filter((item) => item.isActive && item.status === 'active')
    const selected = activeItems.find((item) => item.id === selectedIntegrationId) ?? activeItems[0]
    if (!selected || selected.id === selectedIntegrationId) return
    setSelectedIntegrationId(selected.id)
    financialSalesStore.setIntegration(selected.id)
    financialSalesStore.setMonths(months)
    void financialSalesStore.load()
  }, [integrations, selectedIntegrationId, months])

  const activeIntegrations = integrations.status === 'success'
    ? integrations.items.filter((item) => item.isActive && item.status === 'active')
    : []
  const report = sales.status === 'success' ? sales.report : undefined

  return (
    <section className="dashboard financial-sales-page" data-testid="financial-dashboard">
      <div className="dashboard-overview-topbar">
        {navigation}
        <button className="dashboard-refresh" onClick={() => void financialSalesStore.retry()} disabled={sales.status === 'loading'} type="button">
          <RefreshCw size={16} /> Обновить
        </button>
      </div>
      <header className="dashboard-header financial-sales-header">
        <div>
          <span className="application-eyebrow">Данные подключённой 1С</span>
          <h1>{view === 'overview' ? 'Аналитика' : 'Все отчёты'}</h1>
          <p>{report?.period ? `Период: ${formatDate(report.period.from)} — ${formatDate(report.period.to)}` : 'Загружаем доступный период'}</p>
        </div>
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
            {activeIntegrations.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
        </label>
        {report && report.currencies.length > 0 && (
          <label>
            <span>Валюта документов</span>
            <select
              value={report.money.currencyKey ?? ''}
              onChange={(event) => {
                financialSalesStore.setCurrency(event.target.value)
                void financialSalesStore.load()
              }}
              data-testid="financial-currency-select"
            >
              {report.currencies.map((currency) => (
                <option value={currency.key} key={currency.key}>{currency.name} · {currency.documentCount} док.</option>
              ))}
            </select>
          </label>
        )}
        <div className="dashboard-periods" role="group" aria-label="Период отчёта">
          {([{ value: 3, label: '3 месяца' }, { value: 6, label: '6 месяцев' }] as const).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={months === value}
              onClick={() => {
                setMonths(value)
                financialSalesStore.setMonths(value)
                void financialSalesStore.load()
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {integrations.status === 'loading' && <p role="status">Загружаем подключения…</p>}
      {integrations.status === 'error' && <StateCard title="Не удалось загрузить подключения" action={() => void integrationsStore.retry()} />}
      {integrations.status === 'success' && activeIntegrations.length === 0 && <StateCard title="Нет активных подключений 1С" />}
      {sales.status === 'loading' && <p role="status">Загружаем аналитику из 1С…</p>}
      {sales.status === 'error' && <StateCard title="Аналитика 1С недоступна" message={describeError(sales.error)} action={() => void financialSalesStore.retry()} />}
      {sales.status === 'success' && sales.report.financialStatus === 'empty' && <StateCard title="В 1С нет проведённых реализаций с указанной валютой" />}
      {sales.status === 'success' && sales.report.financialStatus === 'available' && (
        <motion.div
          key={view}
          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.18 }}
        >
          {view === 'overview'
            ? <AnalyticsOverview report={sales.report} />
            : <AnalyticsCatalog report={sales.report} />}
        </motion.div>
      )}
    </section>
  )
}

function StateCard({ title, message, action }: { title: string; message?: string; action?: () => void }) {
  return <div className="dashboard-state" role={message ? 'alert' : undefined}><h2>{title}</h2>{message && <p>{message}</p>}{action && <button className="dashboard-refresh" type="button" onClick={action}>Повторить</button>}</div>
}

function formatDate(value: string) { return new Intl.DateTimeFormat('ru-RU').format(new Date(`${value}T00:00:00Z`)) }

export { AnalyticsCatalog, AnalyticsOverview } from './real-analytics-views'
