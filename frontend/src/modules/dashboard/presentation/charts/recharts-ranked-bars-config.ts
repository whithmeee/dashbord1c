import type { ReportPoint } from '../../domain/dashboard-report'

export function createRankedBarData(points: ReportPoint[]) {
  return points.map((point) => ({ name: point.label, value: point.amount }))
}

export function getRankedBarHeight(points: ReportPoint[]) {
  return Math.max(180, points.length * 44 + 20)
}

export function getRankedBarAnimation(reducedMotion: boolean) {
  return {
    isAnimationActive: !reducedMotion,
    animationDuration: reducedMotion ? 0 : 520,
  }
}
