import { describe, expect, it } from 'vitest'
import type { ReportPoint } from '../../domain/dashboard-report'
import {
  createRevenueAreaData,
  getRevenueAreaAnimation,
} from './recharts-revenue-chart-config'

const points: ReportPoint[] = [
  { label: 'Янв', amount: 120000 },
  { label: 'Фев', amount: 145000 },
]

describe('Recharts revenue area', () => {
  it('keeps the dashboard dataset unchanged while adapting it for Recharts', () => {
    expect(createRevenueAreaData(points)).toEqual([
      { label: 'Янв', amount: 120000 },
      { label: 'Фев', amount: 145000 },
    ])
    expect(points).toEqual([
      { label: 'Янв', amount: 120000 },
      { label: 'Фев', amount: 145000 },
    ])
  })

  it('uses a short update animation and disables movement for reduced motion', () => {
    expect(getRevenueAreaAnimation(false)).toEqual({
      isAnimationActive: true,
      animationDuration: 520,
      animationEasing: 'ease-out',
    })
    expect(getRevenueAreaAnimation(true)).toEqual({
      isAnimationActive: false,
      animationDuration: 0,
      animationEasing: 'ease-out',
    })
  })
})
