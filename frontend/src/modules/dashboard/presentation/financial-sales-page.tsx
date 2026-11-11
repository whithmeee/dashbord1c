import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Building2, FileCheck2, RefreshCw, TrendingUp, Users } from 'lucide-react'
import { describeError } from '../../../shared/api'
import { authSessionStore } from '../../auth/react/auth-runtime'
import { integrationsStore } from '../../integrations/integrations-runtime'
import { financialSalesStore } from '../financial-sales-runtime'
import type { MonthlyAmount, RankedAmount, SalesReport } from '../domain/financial-sales'
import { RechartsRevenueArea } from './charts/recharts-revenue-chart'
import { RechartsDebtorsDoughnut } from './charts/recharts-debtors-chart'
import { FinanceChart } from './charts/finance-chart'
import { ReportDetails } from './reports/report-details'
import './page/dashboard.css'
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
          {([3, 6] as const).map((value) => (
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
              {value} месяца
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

export function AnalyticsOverview({ report }: { report: SalesReport }) {
  const currency = report.money.currency ?? ''
  const monthly = points(report.monthly)
  const customers = rankedPoints(report.customers)
  return (
    <div className="dashboard-reports">
      <Metric icon={<TrendingUp size={20} />} label="Сумма реализаций" value={`${formatAmount(report.totalAmount)} ${currency}`} note="Сумма документов в выбранной валюте" />
      <Metric icon={<FileCheck2 size={20} />} label="Проведено реализаций" value={String(report.metrics.salesDocuments)} note="Без помеченных на удаление" />
      <Metric icon={<Users size={20} />} label="Покупатели" value={String(report.metrics.customers)} note="По проведённым реализациям" />
      <Metric icon={<Building2 size={20} />} label="Организации" value={String(report.metrics.organizations)} note="В выбранной валюте" />
      <ReportCard title="Реализации по месяцам" description={`Сумма документов · ${currency}`} className="dashboard-report-wide" points={monthly}>
        <RechartsRevenueArea points={monthly} />
      </ReportCard>
      <ReportCard title="Покупатели по реализациям" description={`Топ покупателей · ${currency}`} className="dashboard-report-half" points={customers}>
        <RechartsDebtorsDoughnut points={customers} />
      </ReportCard>
    </div>
  )
}

export function AnalyticsCatalog({ report }: { report: SalesReport }) {
  const currency = report.money.currency ?? ''
  const reports = [
    { key: 'sales', title: 'Реализации по месяцам', description: `Сумма документов · ${currency}`, points: points(report.monthly), color: '#2676d8', variant: 'line' as const },
    { key: 'customers', title: 'Топ покупателей', description: `По сумме реализаций · ${currency}`, points: rankedPoints(report.customers), color: '#3478d4', variant: 'bar' as const },
    { key: 'organizations', title: 'Реализации по организациям', description: `По сумме документов · ${currency}`, points: rankedPoints(report.organizations), color: '#6861ce', variant: 'bar' as const },
    { key: 'receipts', title: 'Поступления на расчётный счёт', description: `Движение денег, не выручка · ${currency}`, points: points(report.receipts), color: '#25866c', variant: 'bar' as const },
    { key: 'payments', title: 'Списания с расчётного счёта', description: `Движение денег, не расходы · ${currency}`, points: points(report.payments), color: '#b76588', variant: 'bar' as const },
    { key: 'documents', title: 'Количество реализаций', description: 'Проведённые документы по месяцам', points: report.monthly.map((item) => ({ label: monthLabel(item.period), amount: item.documentCount })), color: '#d68b20', variant: 'bar' as const },
  ]
  return (
    <div className="dashboard-reports financial-report-catalog" data-testid="real-report-catalog">
      {reports.map((item) => (
        <ReportCard key={item.key} title={item.title} description={item.description} points={item.points}>
          <FinanceChart points={item.points} label={item.title} color={item.color} variant={item.variant} />
        </ReportCard>
      ))}
    </div>
  )
}

function Metric({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return <article className="dashboard-metric"><span className="dashboard-metric-icon">{icon}</span><span>{label}</span><strong>{value}</strong><small>{note}</small></article>
}

function ReportCard({ title, description, points: reportPoints, className = '', children }: { title: string; description: string; points: { label: string; amount: number }[]; className?: string; children: ReactNode }) {
  return <article className={`dashboard-report ${className}`.trim()}><header><h2>{title}</h2><p>{description}</p></header>{children}<ReportDetails buttonLabel="Данные" points={reportPoints} label={title} /></article>
}

function StateCard({ title, message, action }: { title: string; message?: string; action?: () => void }) {
  return <div className="dashboard-state" role={message ? 'alert' : undefined}><h2>{title}</h2>{message && <p>{message}</p>}{action && <button className="dashboard-refresh" type="button" onClick={action}>Повторить</button>}</div>
}

function points(items: readonly MonthlyAmount[]) { return items.map((item) => ({ label: monthLabel(item.period), amount: item.amount })) }
function rankedPoints(items: readonly RankedAmount[]) { return items.map((item) => ({ label: item.name, amount: item.amount })) }
function monthLabel(period: string) { return new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(new Date(`${period}-01T00:00:00Z`)).replace('.', '') }
function formatAmount(amount: number) { return amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function formatDate(value: string) { return new Intl.DateTimeFormat('ru-RU').format(new Date(`${value}T00:00:00Z`)) }
