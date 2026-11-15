import { describe, expect, it } from 'vitest'
import type { ReportPoint } from '../../domain/dashboard-report'
import {
  createRankedBarData,
  getRankedBarAnimation,
  getRankedBarHeight,
} from './recharts-ranked-bars-config'

const points: ReportPoint[] = [
  { label: 'ООО Альфа с длинным названием', amount: 120000 },
  { label: 'ООО Бета', amount: 80000 },
  { label: 'ООО Гамма', amount: 60000 },
  { label: 'ООО Дельта', amount: 40000 },
  { label: 'ООО Эпсилон', amount: 20000 },
  { label: 'ООО Дзета', amount: 10000 },
]

describe('Recharts ranked bars', () => {
  it('keeps every ranked item and source amount', () => {
    expect(createRankedBarData(points)).toEqual(points.map((point) => ({
      name: point.label,
      value: point.amount,
    })))
    expect(points[0]).toEqual({ label: 'ООО Альфа с длинным названием', amount: 120000 })
  })

  it('grows to fit every row without compressing labels', () => {
    expect(getRankedBarHeight([])).toBe(180)
    expect(getRankedBarHeight(points)).toBe(284)
  })

  it('disables entrance animation for reduced motion', () => {
    expect(getRankedBarAnimation(false)).toEqual({ isAnimationActive: true, animationDuration: 520 })
    expect(getRankedBarAnimation(true)).toEqual({ isAnimationActive: false, animationDuration: 0 })
  })
})
