import type { ReportPoint } from '../../domain/dashboard-report'

const debtorColors = ['#005bb5', '#2875c5', '#528fd5', '#80a9df', '#b1c9eb']

export function createDebtorsDoughnutData(points: ReportPoint[]) {
  return points.map((point, index) => ({
    name: point.label,
    value: point.amount,
    fill: debtorColors[index % debtorColors.length],
  }))
}

export function getDebtorsDoughnutAnimation(reducedMotion: boolean) {
  return {
    isAnimationActive: !reducedMotion,
    animationDuration: reducedMotion ? 0 : 520,
  }
}
