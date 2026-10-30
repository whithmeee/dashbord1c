import type {
  DashboardPeriod,
  DashboardReport,
  DashboardResult,
} from '../../domain/dashboard-report'

export type DashboardState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      report: DashboardReport
      displayedPeriod: DashboardPeriod
      refreshing: boolean
    }
export type DashboardSession = {
  period: DashboardPeriod
  state: DashboardState
  revision: number
}
export type DashboardAction =
  | { type: 'select-period'; period: DashboardPeriod }
  | { type: 'refresh' }
  | { type: 'loading' }
  | { type: 'loaded'; result: DashboardResult; period: DashboardPeriod }

export const initialDashboardSession: DashboardSession = {
  period: 'half-year',
  state: { status: 'loading' },
  revision: 0,
}

function beginLoading(state: DashboardState): DashboardState {
  return state.status === 'ready'
    ? { ...state, refreshing: true }
    : { status: 'loading' }
}

export function isDashboardLoading(state: DashboardState) {
  return (
    state.status === 'loading' || (state.status === 'ready' && state.refreshing)
  )
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
            state: beginLoading(session.state),
          }
    case 'refresh':
      return {
        ...session,
        revision: session.revision + 1,
        state: beginLoading(session.state),
      }
    case 'loading':
      return { ...session, state: beginLoading(session.state) }
    case 'loaded':
      if (action.period !== session.period) return session
      return {
        ...session,
        state:
          action.result.status === 'ready'
            ? {
                ...action.result,
                displayedPeriod: action.period,
                refreshing: false,
              }
            : action.result,
      }
  }
}
