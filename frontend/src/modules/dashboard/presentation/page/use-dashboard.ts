import { useEffect, useReducer } from 'react'
import type { LoadDashboard } from '../../application/load-dashboard'
import type { DashboardPeriod } from '../../domain/dashboard-report'
import { initialDashboardSession, transitionDashboard } from './dashboard-state'

export function useDashboard(loadDashboard: LoadDashboard) {
  const [session, dispatch] = useReducer(
    transitionDashboard,
    initialDashboardSession,
  )

  useEffect(() => {
    const controller = new AbortController()
    dispatch({ type: 'loading' })
    loadDashboard(session.period, controller.signal).then((result) => {
      if (!controller.signal.aborted && result.status !== 'cancelled') {
        dispatch({ type: 'loaded', result, period: session.period })
      }
    })
    return () => controller.abort()
  }, [session.period, session.revision, loadDashboard])

  return {
    period: session.period,
    state: session.state,
    selectPeriod: (period: DashboardPeriod) =>
      dispatch({ type: 'select-period', period }),
    refresh: () => dispatch({ type: 'refresh' }),
  }
}
