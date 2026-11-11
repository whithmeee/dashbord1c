import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { demoReports } from '../../adapters/demo/demo-reports'
import { DashboardReports } from './dashboard-reports'
import { ReportDetails } from './report-details'

describe('data the backend cannot provide yet', () => {
  it('shows the unavailable mark instead of debt, expenses and cash figures', () => {
    const html = renderToStaticMarkup(
      <DashboardReports report={demoReports.quarter} />,
    )

    expect(html).toContain('На $ · не зависит от периода выручки')
    expect(html).not.toContain('31 октября 2026')
    expect(html).not.toContain('840')
  })

  it('masks table amounts only when asked to', () => {
    const points = [{ label: 'Май', amount: 1500000 }]
    const masked = renderToStaticMarkup(
      <ReportDetails points={points} label="Расходы" masked />,
    )
    const shown = renderToStaticMarkup(
      <ReportDetails points={points} label="Расходы" />,
    )

    expect(masked).toContain('<td>$</td>')
    expect(shown).not.toContain('<td>$</td>')
  })
})
