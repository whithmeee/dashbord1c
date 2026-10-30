import { Search, SearchX } from 'lucide-react'
import { reportGroups } from '../../catalog/report-catalog'
import { useReportCatalog } from '../../catalog/use-report-catalog'
import { CatalogCard } from './catalog-card'
import './report-catalog.css'

export function ReportCatalog({
  onOpenOverview,
}: {
  onOpenOverview: () => void
}) {
  const catalog = useReportCatalog()
  return (
    <section className="dashboard report-catalog" data-testid="report-catalog">
      <header className="dashboard-header">
        <div>
          <span className="application-eyebrow">
            1С:Бухгалтерия предприятия 3.0
          </span>
          <h1>Каталог отчётов</h1>
          <p>Аналитика и бухгалтерские отчёты в одном месте</p>
        </div>
      </header>
      <p className="report-catalog-note">
        Базовый состав для прототипа. Полный перечень уточним по вашей базе 1С.
        Регламентированные формы пока не включены.
      </p>
      <label className="report-catalog-search">
        <Search size={18} />
        <span className="report-catalog-search-label">Поиск отчёта</span>
        <input
          type="search"
          placeholder="Название, показатель или ОСВ…"
          aria-label="Поиск отчёта"
          value={catalog.query}
          onChange={(event) => catalog.setQuery(event.target.value)}
          data-testid="catalog-search"
        />
      </label>
      <div
        className="report-catalog-filters"
        role="group"
        aria-label="Группы отчётов"
      >
        {reportGroups.map((group) => (
          <button
            key={group.id}
            type="button"
            aria-pressed={catalog.group === group.id}
            onClick={() => catalog.setGroup(group.id)}
            data-testid={`catalog-group-${group.id}`}
          >
            {group.label}
          </button>
        ))}
      </div>
      <div className="report-catalog-results">
        <span role="status" data-testid="catalog-count">
          Найдено: {catalog.reports.length} из {catalog.total}
        </span>
        <button type="button" onClick={catalog.reset}>
          Сбросить фильтры
        </button>
      </div>
      {catalog.reports.length ? (
        <div className="report-catalog-grid">
          {catalog.reports.map((report) => (
            <CatalogCard
              key={report.id}
              report={report}
              onOpenOverview={onOpenOverview}
            />
          ))}
        </div>
      ) : (
        <div className="report-catalog-empty">
          <SearchX size={28} />
          <h2>Отчёты не найдены</h2>
          <p>Измените запрос или сбросьте фильтры.</p>
          <button type="button" onClick={catalog.reset}>
            Показать все отчёты
          </button>
        </div>
      )}
    </section>
  )
}
