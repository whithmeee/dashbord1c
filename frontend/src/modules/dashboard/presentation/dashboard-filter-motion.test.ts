import { describe, expect, it } from 'vitest'
import { dashboardFilterMotion, getDashboardDetailsTransition } from './dashboard-filter-motion'

describe('dashboard filters and report details motion', () => {
  it('uses a shared layout transition for the active period', () => {
    expect(dashboardFilterMotion.layoutId).toBe('period-selection')
    expect(dashboardFilterMotion.transition).toEqual({
      duration: 0.2,
      ease: [0.23, 1, 0.32, 1],
    })
  })

  it('uses a bounded details transition and disables it for reduced motion', () => {
    expect(getDashboardDetailsTransition(false)).toEqual({
      duration: 0.22,
      ease: [0.23, 1, 0.32, 1],
    })
    expect(getDashboardDetailsTransition(true)).toEqual({ duration: 0 })
  })
})
