import type { ReportPoint } from '../../domain/dashboard-report'

export function createFinanceChartData(points: ReportPoint[]) {
  return points.map((point) => ({ ...point }))
}

export function getFinanceChartAnimation(reducedMotion: boolean) {
  return {
    isAnimationActive: !reducedMotion,
    animationDuration: reducedMotion ? 0 : 420,
  }
}
