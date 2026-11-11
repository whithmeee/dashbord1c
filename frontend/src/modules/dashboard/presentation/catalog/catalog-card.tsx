import { ArrowUpRight, ChartNoAxesCombined, Table2 } from 'lucide-react'
import type { CatalogReport } from '../../catalog/report-catalog'
import { reportGroups } from '../../catalog/report-catalog'

export function CatalogCard({
  report,
  onOpenOverview,
}: {
  report: CatalogReport
  onOpenOverview: () => void
}) {
  const Icon = report.format === 'chart' ? ChartNoAxesCombined : Table2
  return (
    <article
      className="report-catalog-card"
      data-testid={`catalog-report-${report.id}`}
    >
      <div className="report-catalog-card-top">
        <span className="report-catalog-icon">
          <Icon size={20} />
        </span>
        <span
          className="report-catalog-badge"
        >
          Данные 1С
        </span>
      </div>
      <small>
        {reportGroups.find((group) => group.id === report.group)?.label}
      </small>
      <h2>{report.title}</h2>
      <p>{report.description}</p>
      <div className="report-catalog-card-bottom">
        <span>
          {report.format === 'chart' ? 'График и таблица' : 'Таблица'}
        </span>
        <button type="button" onClick={onOpenOverview}>
          Открыть обзор <ArrowUpRight size={14} />
        </button>
      </div>
    </article>
  )
}
