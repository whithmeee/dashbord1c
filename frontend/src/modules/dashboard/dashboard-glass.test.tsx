import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Dashboard } from './dashboard'
import { demoReports } from './adapters/demo/demo-reports'
import { DashboardReports } from './presentation/reports/dashboard-reports'

describe('dashboard glass presentation', () => {
  it('marks the dashboard workspace for the aurora glass theme without losing landmarks', () => {
    const markup = renderToStaticMarkup(
      <Dashboard
        expanded={false}
        onBack={() => undefined}
        onToggleExpanded={() => undefined}
      />,
    )

    expect(markup).toContain('dashboard-workspace-glass')
    expect(markup).toContain(
      '<div class="dashboard-background" aria-hidden="true"></div>',
    )
    expect(markup).toContain('aria-label="Разделы дашборда"')
    expect(markup).toContain('Демонстрационные данные')
  })

  it('keeps the neutral blurred layer clipped behind the dashboard', () => {
    const styles = readFileSync(
      new URL('./dashboard-glass.css', import.meta.url),
      'utf8',
    )

    expect(styles).toContain('overflow: clip;')
    expect(styles).toContain('filter: blur(72px);')
    expect(styles).not.toContain('backdrop-filter')
  })

  it('preserves the KPI and report card structure', () => {
    const markup = renderToStaticMarkup(
      <DashboardReports report={demoReports['half-year']} />,
    )

    expect(markup.match(/class="dashboard-metric"/g)).toHaveLength(4)
    expect(markup.match(/class="dashboard-report /g)).toHaveLength(4)
    expect(markup).toContain('Выручка по месяцам')
    expect(markup).toContain('Распределение задолженности')
  })
})
