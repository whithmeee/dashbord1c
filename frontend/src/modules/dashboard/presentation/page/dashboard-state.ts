import type {
  DashboardPeriod,
  DashboardResult,
} from '../../domain/dashboard-report'

export type DashboardState = DashboardResult | { status: 'loading' }
export type DashboardSession = {
  period: DashboardPeriod
  state: DashboardState
  revision: number
}
export type DashboardAction =
  | { type: 'select-period'; period: DashboardPeriod }
  | { type: 'refresh' }
  | { type: 'loading' }
  | { type: 'loaded'; result: DashboardResult }

export const initialDashboardSession: DashboardSession = {
  period: 'half-year',
  state: { status: 'loading' },
  revision: 0,
}

export function transitionDashboard(
  session: DashboardSession,
  action: DashboardAction,
): DashboardSession {
  switch (action.type) {
    case 'select-period':
      return action.period === session.period
        ? session
        : {
            ...session,
            period: action.period,
            state: { status: 'loading' },
          }
    case 'refresh':
      return {
        ...session,
        revision: session.revision + 1,
        state: { status: 'loading' },
      }
    case 'loading':
      return { ...session, state: { status: 'loading' } }
    case 'loaded':
      return { ...session, state: action.result }
  }
}
