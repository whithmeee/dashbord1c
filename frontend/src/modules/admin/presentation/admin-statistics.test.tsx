import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { AdminGateway } from '../domain/admin-gateway'
import { AdminStatistics } from './admin-statistics'

describe('admin statistics filters', () => {
  it('renders calendar buttons for the date range and keeps submit available', () => {
    const gateway = { statistics: vi.fn() } as unknown as AdminGateway
    const html = renderToStaticMarkup(<AdminStatistics gateway={gateway} expire={() => undefined} />)

    expect(html).toContain('Дата начала')
    expect(html).toContain('Дата окончания')
    expect(html).toContain('Показать')
    expect(html).not.toContain('type="date"')
  })
})
