import type { ReportPoint } from '../../domain/dashboard-report'

export function createRevenueAreaData(points: ReportPoint[]): ReportPoint[] {
  return points.map((point) => ({ ...point }))
}

export function getRevenueAreaAnimation(reducedMotion: boolean) {
  return {
    isAnimationActive: !reducedMotion,
    animationDuration: reducedMotion ? 0 : 520,
    animationEasing: 'ease-out' as const,
  }
}
