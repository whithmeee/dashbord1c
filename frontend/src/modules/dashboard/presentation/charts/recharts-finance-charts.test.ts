import { describe, expect, it } from 'vitest'
import type { ReportPoint } from '../../domain/dashboard-report'
import {
  createFinanceChartData,
  getFinanceChartAnimation,
} from './recharts-finance-charts-config'

const points: ReportPoint[] = [{ label: 'Янв', amount: 42000 }]

describe('Recharts finance charts', () => {
  it('maps financial points to chart data without mutating them', () => {
    expect(createFinanceChartData(points)).toEqual([{ label: 'Янв', amount: 42000 }])
    expect(points).toEqual([{ label: 'Янв', amount: 42000 }])
  })

  it('keeps chart motion short and removable for reduced motion', () => {
    expect(getFinanceChartAnimation(false)).toEqual({
      isAnimationActive: true,
      animationDuration: 420,
    })
    expect(getFinanceChartAnimation(true)).toEqual({
      isAnimationActive: false,
      animationDuration: 0,
    })
  })
})
