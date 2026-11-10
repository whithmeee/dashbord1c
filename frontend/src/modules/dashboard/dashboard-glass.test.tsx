import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Dashboard } from './dashboard'
import { demoReports } from './adapters/demo/demo-reports'
import { DashboardReports } from './presentation/reports/dashboard-reports'

describe('dashboard glass presentation', () => {
  it('renders a static decorative background without losing dashboard landmarks', () => {
    const markup = renderToStaticMarkup(
      <Dashboard
        expanded={false}
        onBack={() => undefined}
        onToggleExpanded={() => undefined}
      />,
    )

    expect(markup).toContain('dashboard-workspace-glass')
    expect(markup).toContain('class="dashboard-glass-background" aria-hidden="true"')
    expect(markup.includes('glass-ui-container')).toBe(false)
    expect(markup.includes('<feDisplacementMap')).toBe(false)
    expect(markup).not.toContain('class="dashboard-background"')
    expect(markup).toContain('aria-label="Разделы дашборда"')
    expect(markup).toContain('Демонстрационные данные')
  })

  it('preserves the KPI and report card structure', () => {
    const markup = renderToStaticMarkup(
      <DashboardReports report={demoReports['half-year']} />,
    )

    expect(markup.match(/class="dashboard-metric"/g)).toHaveLength(4)
    expect(markup.match(/class="dashboard-report /g)).toHaveLength(4)
    expect(markup).toContain('data-testid="recharts-expenses-chart"')
    expect(markup).toContain('data-testid="recharts-cash-chart"')
    expect(markup).toContain('общий долг')
    expect(markup).toContain('Выручка по месяцам')
    expect(markup).toContain('Распределение задолженности')
  })
})
