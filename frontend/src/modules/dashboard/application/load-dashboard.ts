import type {
  DashboardPeriod,
  DashboardResult,
} from '../domain/dashboard-report'

export type DashboardSource = (
  period: DashboardPeriod,
  signal: AbortSignal,
) => Promise<DashboardResult>

export type DashboardLoadResult = DashboardResult | { status: 'cancelled' }
export type LoadDashboard = (
  period: DashboardPeriod,
  signal: AbortSignal,
) => Promise<DashboardLoadResult>

export function createLoadDashboard(source: DashboardSource): LoadDashboard {
  return async (period, signal) => {
    if (signal.aborted) return { status: 'cancelled' }
    const result = await source(period, signal)
    return signal.aborted ? { status: 'cancelled' } : result
  }
}
