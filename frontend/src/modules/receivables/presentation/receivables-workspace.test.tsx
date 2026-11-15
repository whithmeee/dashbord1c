import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { mapReceivablesSummary } from '../domain/receivables-mapper'
import { receivablesSummaryResponse } from '../testing/receivables-fixture'
import { ReceivablesWorkspace } from './receivables-workspace'

describe('receivables workspace', () => {
  it('renders debt totals, paid share and receivables checks', () => {
    const html = renderToStaticMarkup(
      <ReceivablesWorkspace
        summary={mapReceivablesSummary(receivablesSummaryResponse)}
        integrations={[{ id: 7, name: 'Бухгалтерия' }]}
        integrationId={7}
        month="2026-10"
        scanning={false}
        progress={100}
        details={{ status: 'idle' }}
        onIntegrationChange={() => undefined}
        onMonthChange={() => undefined}
        onScan={() => undefined}
        onOpenCheck={() => undefined}
        onCloseDetails={() => undefined}
      />,
    )

    expect(html).toContain('Контроль дебиторки')
    expect(html).toContain('Задолженность покупателей')
    expect(html).toContain('48%')
    expect(html).toContain('Нет оплаты за месяц')
    expect(html).toContain('Оплачено частично')
    expect(html).toContain('Месяц дебиторки')
  })
})
