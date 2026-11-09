import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { CabinetDetailsState } from '../../application/cabinet-details-store'
import type { CabinetDashboard } from '../../domain/cabinet'
import type {
  CabinetStatistics,
  CabinetSubscription,
  CabinetSystemStatus,
} from '../../domain/cabinet-details'
import { allowEverySection, type SectionAccess } from '../../../auth/domain/section-access'
import { OverviewKpiCards } from '../overview/overview-kpi-cards'
import { OverviewSystemStatus } from '../overview/overview-system-status'
import { StatisticsReport } from './statistics-report'
import { SubscriptionDialog } from './subscription-dialog'

const subscription: CabinetSubscription = {
  status: 'active',
  state: 'active',
  startsAt: '2026-10-01',
  endsAt: '2026-11-12',
  totalDays: 43,
  elapsedDays: 40,
  daysLeft: 3,
  progressPercent: 93,
  expiresSoon: true,
}

const statistics: CabinetStatistics = {
  period: { from: '2026-10-01', to: '2026-10-31', group: 'day' },
  total: 12,
  summary: {
    averagePerDay: 0.4,
    activeDays: 3,
    peakDay: { date: '2026-10-05', requests: 7 },
    lastRequestAt: '2026-10-20T18:45:00+00:00',
  },
  byPeriod: [
    { period: '2026-10-01', requests: 0 },
    { period: '2026-10-05', requests: 7 },
  ],
  byIntegration: [{ integrationId: 3, name: 'Основная', requests: 12 }],
  byAuthor: [{ type: 'employee', id: 5, name: 'Иван', requests: 5 }],
}

const systemStatus = (overrides: Partial<CabinetSystemStatus>): CabinetSystemStatus => ({
  status: 'operational',
  message: 'Все системы работают.',
  total: 0,
  activeCount: 0,
  inactiveCount: 0,
  integrations: [],
  ...overrides,
})

const success = (system: CabinetSystemStatus): CabinetDetailsState => ({
  status: 'success',
  systemStatus: system,
  subscription,
  statistics,
})

const dashboard = (withEmployees: boolean): CabinetDashboard => ({
  company: {
    id: 1,
    name: 'ООО Ромашка',
    email: 'd@r.test',
    emailVerified: true,
    subscriptionStatus: 'active',
    phones: [],
    messengers: [],
    createdAt: '2026-10-01T00:00:00Z',
  },
  viewer: { type: 'company', name: 'Осминог', position: null },
  integrations: { count: 2, activeCount: 1, items: [] },
  employees: withEmployees ? { count: 3, onlineCount: 1, items: [] } : undefined,
})

describe('subscription dialog', () => {
  it('shows term, days left and the expiry warning', () => {
    const html = renderToStaticMarkup(<SubscriptionDialog subscription={subscription} onClose={vi.fn()} />)

    expect(html).toContain('data-testid="subscription-dialog"')
    expect(html).toContain('Активна')
    expect(html).toContain('3 дня')
    expect(html).toContain('43 дня')
    expect(html).toContain('Подписка скоро закончится')
    expect(html).toContain('aria-valuenow="93"')
  })

  it('shows an expired subscription without the warning', () => {
    const expired: CabinetSubscription = { ...subscription, status: 'inactive', state: 'expired', daysLeft: 0, expiresSoon: false }
    const html = renderToStaticMarkup(<SubscriptionDialog subscription={expired} onClose={vi.fn()} />)

    expect(html).toContain('Срок действия истёк')
    expect(html).toContain('0 дней')
    expect(html).not.toContain('Подписка скоро закончится')
  })

  it('explains that details are unavailable', () => {
    const html = renderToStaticMarkup(<SubscriptionDialog onClose={vi.fn()} />)

    expect(html).toContain('Данные о подписке пока недоступны')
  })
})

describe('system status', () => {
  it('says that no databases are connected', () => {
    const html = renderToStaticMarkup(
      <OverviewSystemStatus detailsState={success(systemStatus({ status: 'inactive', message: 'Не активно: ни одной базы не подключено.' }))} />,
    )

    expect(html).toContain('Не активно: ни одной базы не подключено.')
    expect(html).toContain('Не активно')
    expect(html).not.toContain('system-status-bases')
  })

  it('lists databases with their status and the reason', () => {
    const html = renderToStaticMarkup(
      <OverviewSystemStatus
        detailsState={success(systemStatus({
          status: 'degraded',
          message: 'Работает частично: активно баз 1 из 2.',
          total: 2,
          activeCount: 1,
          inactiveCount: 1,
          integrations: [
            { id: 1, name: 'Основная', status: 'active', reason: null, checkedAt: null },
            { id: 2, name: 'Филиал', status: 'inactive', reason: 'unreachable', checkedAt: null },
          ],
        }))}
      />,
    )

    expect(html).toContain('1 из 2 интеграций активны')
    expect(html).toContain('Основная')
    expect(html).toContain('активна')
    expect(html).toContain('не активна · не отвечает')
    expect(html).toContain('Частично')
  })

  it('shows progress while details are loading', () => {
    const html = renderToStaticMarkup(<OverviewSystemStatus detailsState={{ status: 'loading' }} />)

    expect(html).toContain('Проверяем доступность интеграций и сервисов.')
  })
})

describe('overview cards', () => {
  const render = (owner: boolean, access: SectionAccess = allowEverySection) => renderToStaticMarkup(
    <OverviewKpiCards
      dashboard={dashboard(owner)}
      detailsState={success(systemStatus({}))}
      access={access}
      onSelectTab={vi.fn()}
      onOpenDialog={vi.fn()}
    />,
  )

  it('hides the cards of sections the employee has no access to', () => {
    const html = render(false, (section) => section === 'subscription')

    expect(html).toContain('data-testid="kpi-subscription"')
    expect(html).not.toContain('data-testid="kpi-integrations"')
    expect(html).not.toContain('data-testid="kpi-statistics"')
  })

  it('makes subscription, users and statistics cards interactive for the owner', () => {
    const html = render(true)

    expect(html).toContain('<button class="cabinet-kpi-card" type="button" data-testid="kpi-subscription"')
    expect(html).toContain('<button class="cabinet-kpi-card" type="button" data-testid="kpi-employees"')
    expect(html).toContain('<button class="cabinet-kpi-card" type="button" data-testid="kpi-statistics"')
    expect(html).toContain('Осталось дней: 3')
    expect(html).toContain('1 онлайн')
  })

  it('keeps the users card informational for an employee', () => {
    const html = render(false)

    expect(html).toContain('<div class="cabinet-kpi-card cabinet-kpi-card-static" data-testid="kpi-employees"')
    expect(html).toContain('Для владельца')
  })
})

describe('statistics report', () => {
  it('shows totals, peak day, bars and breakdowns', () => {
    const html = renderToStaticMarkup(<StatisticsReport statistics={statistics} />)

    expect(html).toContain('data-testid="statistics-total">12<')
    expect(html).toContain('data-testid="statistics-bars"')
    expect(html).toContain('По базам 1С')
    expect(html).toContain('По пользователям')
    expect(html).toContain('Иван')
  })

  it('shows an empty state for a month without requests', () => {
    const html = renderToStaticMarkup(
      <StatisticsReport statistics={{ ...statistics, total: 0, byAuthor: [], byIntegration: [] }} />,
    )

    expect(html).toContain('За этот месяц запросов к ИИ не было.')
    expect(html).not.toContain('statistics-bars')
  })

  it('omits the per-user breakdown for an employee', () => {
    const html = renderToStaticMarkup(<StatisticsReport statistics={{ ...statistics, byAuthor: [] }} />)

    expect(html).not.toContain('По пользователям')
  })
})
