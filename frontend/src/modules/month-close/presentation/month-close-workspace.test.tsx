import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { mapMonthCloseSummary } from '../domain/month-close-mapper'
import { monthCloseSummaryResponse } from '../testing/month-close-fixture'
import { MonthCloseWorkspace } from './month-close-workspace'

describe('month close workspace', () => {
  it('renders readiness, checks and scanning progress in Osminog style', () => {
    const html = renderToStaticMarkup(
      <MonthCloseWorkspace
        summary={mapMonthCloseSummary(monthCloseSummaryResponse)}
        integrations={[{ id: 7, name: 'Бухгалтерия' }]}
        integrationId={7}
        month="2026-10"
        scanning
        progress={64}
        details={{ status: 'idle' }}
        onIntegrationChange={() => undefined}
        onMonthChange={() => undefined}
        onScan={() => undefined}
        onOpenCheck={() => undefined}
        onCloseDetails={() => undefined}
      />,
    )

    expect(html).toContain('Помощник закрытия месяца')
    expect(html).toContain('Готовность к закрытию')
    expect(html).toContain('80%')
    expect(html).toContain('Сканируем 64%')
    expect(html).toContain('Не проведены')
    expect(html).toContain('3')
  })
})
