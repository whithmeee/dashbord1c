import { useState } from 'react'
import { AlertTriangle, ChevronRight, CircleAlert, Database, RefreshCw, ScanSearch } from 'lucide-react'
import { Select } from '../../../shared/ui/select'
import type { DataQualityIssue, DataQualityReport } from '../domain/data-quality'
import { resolutionOf, type CounterpartyChange } from '../domain/data-quality-resolution'
import { filterDataQualityIssues, type CategoryFilter, type SeverityFilter } from './data-quality-filter'
import { DataQualityHint } from './data-quality-hint'
import { DataQualityIssueDialog } from './data-quality-issue-dialog'
import { categoryLabels, severityLabels } from './data-quality-labels'

type IntegrationOption = { readonly id: number; readonly name: string }

const severityOptions = [
  { value: 'all', label: 'Все уровни' },
  { value: 'critical', label: 'Критические' },
  { value: 'warning', label: 'Предупреждения' },
  { value: 'info', label: 'Информация' },
] as const

const categoryOptions = [
  { value: 'all', label: 'Все категории' },
  ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
]

export function DataQualityReportView({ report, integrations, selectedIntegrationId, onSelect, onRefresh, onFix }: {
  report: DataQualityReport
  integrations: readonly IntegrationOption[]
  selectedIntegrationId: number
  onSelect: (id: number) => void
  onRefresh: () => void
  onFix: (objectId: string, change: CounterpartyChange) => Promise<void>
}) {
  const [severity, setSeverity] = useState<SeverityFilter>('all')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [selectedIssue, setSelectedIssue] = useState<DataQualityIssue>()
  const issues = filterDataQualityIssues(report.issues, severity, category)

  return (
    <section className="data-quality-page" data-testid="data-quality-page">
      <header className="data-quality-heading">
        <div><span>ПРОВЕРКА 1С</span><h1>Контроль данных</h1><p>Находим ошибки в карточках контрагентов и договорах.</p></div>
        <div className="data-quality-actions">
          <label>База 1С<Select ariaLabel="База 1С" value={String(selectedIntegrationId)} options={integrations.map((integration) => ({ value: String(integration.id), label: integration.name }))} onValueChange={(value) => onSelect(Number(value))} /></label>
          <button className="cabinet-button" type="button" onClick={onRefresh}><RefreshCw size={16} />Обновить</button>
        </div>
      </header>
      <div className="data-quality-summary">
        <SummaryCard icon={<CircleAlert />} label="Критические" value={report.summary.totals.critical} tone="critical" />
        <SummaryCard icon={<AlertTriangle />} label="Предупреждения" value={report.summary.totals.warning} tone="warning" />
        <SummaryCard icon={<ScanSearch />} label="Всего проблем" value={report.summary.totals.issues} />
        <SummaryCard icon={<Database />} label="Проверено объектов" value={report.summary.totals.checkedObjects} />
      </div>
      <div className="data-quality-toolbar">
        <label>Важность<Select ariaLabel="Важность" value={severity} options={severityOptions} onValueChange={(value) => setSeverity(value as SeverityFilter)} /></label>
        <label>Категория<Select ariaLabel="Категория" value={category} options={categoryOptions} onValueChange={(value) => setCategory(value as CategoryFilter)} /></label>
        <time dateTime={report.summary.checkedAt}>Проверено {formatDate(report.summary.checkedAt)}</time>
      </div>
      <IssueList issues={issues} onSelect={setSelectedIssue} />
      <DataQualityIssueDialog issue={selectedIssue} onClose={() => setSelectedIssue(undefined)} onFix={onFix} />
    </section>
  )
}

function SummaryCard({ icon, label, value, tone = 'neutral' }: { icon: React.ReactNode; label: string; value: number; tone?: string }) {
  return <article className={`data-quality-card data-quality-card-${tone}`}><span>{icon}</span><strong>{value}</strong><p>{label}</p></article>
}

function IssueList({ issues, onSelect }: { issues: readonly DataQualityIssue[]; onSelect: (issue: DataQualityIssue) => void }) {
  if (issues.length === 0) return <div className="data-quality-empty"><ScanSearch size={28} /><h2>Проблем не обнаружено</h2><p>Для выбранных фильтров список пуст.</p></div>

  return (
    <div className="data-quality-issue-grid">
      {issues.map((issue) => <IssueCard issue={issue} onSelect={onSelect} key={issue.id} />)}
    </div>
  )
}

function IssueCard({ issue, onSelect }: { issue: DataQualityIssue; onSelect: (issue: DataQualityIssue) => void }) {
  const resolution = resolutionOf(issue)

  return (
    <div className="data-quality-issue-item">
      <button type="button" className="data-quality-issue-card" onClick={() => onSelect(issue)}>
        <span className="data-quality-issue-meta">
          <span className={`data-quality-severity data-quality-severity-${issue.severity}`}>{severityLabels[issue.severity]}</span>
          <span className="data-quality-category">{categoryLabels[issue.category]}</span>
        </span>
        <span className="data-quality-issue-content"><strong>{issue.title}</strong><small>{issue.message}</small></span>
        <span className="data-quality-issue-action">{resolution.kind === 'edit' ? 'Исправить' : 'Подробнее'}<ChevronRight size={16} /></span>
      </button>
      {resolution.kind === 'advice' && <DataQualityHint advice={resolution.advice} />}
    </div>
  )
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}
