type BreakdownRow = {
  readonly key: string
  readonly name: string
  readonly requests: number
}

export function StatisticsBreakdown({ title, rows }: { title: string; rows: readonly BreakdownRow[] }) {
  if (rows.length === 0) {
    return null
  }

  const peak = Math.max(...rows.map((row) => row.requests), 1)

  return (
    <section className="statistics-section">
      <h3>{title}</h3>
      <ul className="statistics-breakdown">
        {rows.map((row) => (
          <li key={row.key}>
            <span className="statistics-breakdown-name">{row.name}</span>
            <span className="statistics-breakdown-track">
              <span style={{ width: `${(row.requests / peak) * 100}%` }} />
            </span>
            <strong>{row.requests}</strong>
          </li>
        ))}
      </ul>
    </section>
  )
}
