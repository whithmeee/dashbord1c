import type { CabinetStatistics } from '../../domain/cabinet-details'
import { formatCalendarDate, formatCalendarDateTime } from '../../domain/cabinet-statistics-period'
import { StatisticsBars } from './statistics-bars'
import { StatisticsBreakdown } from './statistics-breakdown'

export function StatisticsReport({ statistics }: { statistics: CabinetStatistics }) {
  const { summary } = statistics

  if (statistics.total === 0) {
    return (
      <p className="cabinet-dialog-state" data-testid="statistics-empty">
        За этот месяц запросов к ИИ не было.
      </p>
    )
  }

  return (
    <div data-testid="statistics-report">
      <dl className="statistics-tiles">
        <div>
          <dt>Всего запросов</dt>
          <dd data-testid="statistics-total">{statistics.total}</dd>
        </div>
        <div>
          <dt>В среднем в день</dt>
          <dd>{summary.averagePerDay.toLocaleString('ru-RU')}</dd>
        </div>
        <div>
          <dt>Дней с запросами</dt>
          <dd>{summary.activeDays}</dd>
        </div>
        <div>
          <dt>Самый активный день</dt>
          <dd>
            {summary.peakDay
              ? `${formatCalendarDate(summary.peakDay.date)} · ${summary.peakDay.requests}`
              : '—'}
          </dd>
        </div>
        <div>
          <dt>Последний запрос</dt>
          <dd>{summary.lastRequestAt ? formatCalendarDateTime(summary.lastRequestAt) : '—'}</dd>
        </div>
      </dl>
      <StatisticsBars points={statistics.byPeriod} group={statistics.period.group} />
      <StatisticsBreakdown
        title="По базам 1С"
        rows={statistics.byIntegration.map((item) => ({ key: `base-${item.integrationId}`, name: item.name, requests: item.requests }))}
      />
      <StatisticsBreakdown
        title="По пользователям"
        rows={statistics.byAuthor.map((item) => ({ key: `${item.type}-${item.id}`, name: item.name, requests: item.requests }))}
      />
    </div>
  )
}
