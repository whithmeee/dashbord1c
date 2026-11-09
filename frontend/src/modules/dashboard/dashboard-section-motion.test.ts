import { describe, expect, it } from 'vitest'
import { dashboardSectionMotion, getDashboardSectionTransition } from './dashboard-section-motion'

describe('dashboard section motion', () => {
  it('uses a short enter/exit slide with the shared easing', () => {
    expect(dashboardSectionMotion.initial).toEqual({ opacity: 0, y: 8 })
    expect(dashboardSectionMotion.enter).toEqual({ opacity: 1, y: 0 })
    expect(dashboardSectionMotion.exit).toEqual({ opacity: 0, y: -8 })
    expect(getDashboardSectionTransition(false)).toMatchObject({ duration: 0.2 })
  })

  it('removes movement and waiting when reduced motion is enabled', () => {
    expect(getDashboardSectionTransition(true)).toEqual({ duration: 0 })
  })
})
