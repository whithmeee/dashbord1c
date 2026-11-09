import type { CabinetStatistics } from '../../domain/cabinet-details'
import { formatPeriodLabel } from '../../domain/cabinet-statistics-period'

export function StatisticsBars({
  points,
  group,
}: {
  points: CabinetStatistics['byPeriod']
  group: string
}) {
  const peak = Math.max(...points.map((point) => point.requests), 1)

  return (
    <section className="statistics-section">
      <h3>Запросы по дням</h3>
      <ol className="statistics-bars" data-testid="statistics-bars">
        {points.map((point) => (
          <li
            key={point.period}
            title={`${formatPeriodLabel(point.period, group)}: ${point.requests}`}
            aria-label={`${formatPeriodLabel(point.period, group)}: запросов ${point.requests}`}
          >
            <span
              className="statistics-bar"
              data-empty={point.requests === 0}
              style={{ height: `${Math.max((point.requests / peak) * 100, point.requests === 0 ? 2 : 6)}%` }}
            />
          </li>
        ))}
      </ol>
      <p className="statistics-bars-scale">
        <span>{formatPeriodLabel(points[0]?.period ?? '', group)}</span>
        <span>{formatPeriodLabel(points[points.length - 1]?.period ?? '', group)}</span>
      </p>
    </section>
  )
}
