import { describe, expect, it } from 'vitest'
import { dashboardCardMotion, getDashboardCardTransition } from './dashboard-motion'

describe('dashboard card motion', () => {
  it('uses a short vertical entrance with a bounded stagger', () => {
    expect(dashboardCardMotion.initial).toEqual({ opacity: 0, y: 10 })
    expect(dashboardCardMotion.animate).toEqual({ opacity: 1, y: 0 })
    expect(getDashboardCardTransition(false, 3)).toMatchObject({ duration: 0.22, delay: 0.15 })
  })

  it('removes movement, stagger and hover for reduced motion', () => {
    expect(dashboardCardMotion.reducedInitial).toEqual({ opacity: 1, y: 0 })
    expect(getDashboardCardTransition(true, 3)).toEqual({ duration: 0, delay: 0 })
  })

  it('keeps hover movement limited to desktop-friendly transform distance', () => {
    expect(dashboardCardMotion.hover).toEqual({ y: -3 })
    expect(dashboardCardMotion.staggerStep).toBeLessThanOrEqual(0.06)
  })
})
