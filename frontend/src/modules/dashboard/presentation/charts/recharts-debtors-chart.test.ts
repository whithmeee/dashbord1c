import { describe, expect, it } from 'vitest'
import type { ReportPoint } from '../../domain/dashboard-report'
import {
  createDebtorsDoughnutData,
  getDebtorsDoughnutAnimation,
} from './recharts-debtors-chart-config'

const points: ReportPoint[] = [
  { label: 'ООО Альфа', amount: 120000 },
  { label: 'ООО Бета', amount: 80000 },
]

describe('Recharts debtors doughnut', () => {
  it('maps debtor points without changing the source values', () => {
    expect(createDebtorsDoughnutData(points)).toEqual([
      { name: 'ООО Альфа', value: 120000, fill: '#005bb5' },
      { name: 'ООО Бета', value: 80000, fill: '#2875c5' },
    ])
    expect(points[0]).toEqual({ label: 'ООО Альфа', amount: 120000 })
  })

  it('disables the doughnut entrance animation for reduced motion', () => {
    expect(getDebtorsDoughnutAnimation(false)).toEqual({
      isAnimationActive: true,
      animationDuration: 520,
    })
    expect(getDebtorsDoughnutAnimation(true)).toEqual({
      isAnimationActive: false,
      animationDuration: 0,
    })
  })
})
