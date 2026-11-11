import { useState } from 'react'
import { AlertTriangle, CircleAlert, Database, RefreshCw, ScanSearch } from 'lucide-react'
import type { DataQualityIssue, DataQualityReport } from '../domain/data-quality'
import { filterDataQualityIssues, type CategoryFilter, type SeverityFilter } from './data-quality-filter'
import { DataQualityIssueDialog } from './data-quality-issue-dialog'
import { categoryLabels, severityLabels } from './data-quality-labels'

type IntegrationOption = { readonly id: number; readonly name: string }

export function DataQualityReportView({ report, integrations, selectedIntegrationId, onSelect, onRefresh }: {
  report: DataQualityReport
  integrations: readonly IntegrationOption[]
  selectedIntegrationId: number
  onSelect: (id: number) => void
  onRefresh: () => void
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
          <label>База 1С<select value={selectedIntegrationId} onChange={(event) => onSelect(Number(event.target.value))}>{integrations.map((integration) => <option key={integration.id} value={integration.id}>{integration.name}</option>)}</select></label>
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
        <label>Важность<select value={severity} onChange={(event) => setSeverity(event.target.value as SeverityFilter)}><option value="all">Все уровни</option><option value="critical">Критические</option><option value="warning">Предупреждения</option><option value="info">Информация</option></select></label>
        <label>Категория<select value={category} onChange={(event) => setCategory(event.target.value as CategoryFilter)}><option value="all">Все категории</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <time dateTime={report.summary.checkedAt}>Проверено {formatDate(report.summary.checkedAt)}</time>
      </div>
      <IssueList issues={issues} onSelect={setSelectedIssue} />
      <DataQualityIssueDialog issue={selectedIssue} onClose={() => setSelectedIssue(undefined)} />
    </section>
  )
}

function SummaryCard({ icon, label, value, tone = 'neutral' }: { icon: React.ReactNode; label: string; value: number; tone?: string }) {
  return <article className={`data-quality-card data-quality-card-${tone}`}><span>{icon}</span><strong>{value}</strong><p>{label}</p></article>
}

function IssueList({ issues, onSelect }: { issues: readonly DataQualityIssue[]; onSelect: (issue: DataQualityIssue) => void }) {
  if (issues.length === 0) return <div className="data-quality-empty"><ScanSearch size={28} /><h2>Проблем не обнаружено</h2><p>Для выбранных фильтров список пуст.</p></div>

  return <div className="data-quality-list">{issues.map((issue) => <button type="button" key={issue.id} className="data-quality-issue" onClick={() => onSelect(issue)}><span className={`data-quality-severity data-quality-severity-${issue.severity}`}>{severityLabels[issue.severity]}</span><span><strong>{issue.title}</strong><small>{issue.message}</small></span><span className="data-quality-category">{categoryLabels[issue.category]}</span></button>)}</div>
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}
