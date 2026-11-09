import { describe, expect, it } from 'vitest'
import { getAnimatedMetricTransition } from './animated-metric-value'

describe('animated metric value', () => {
  it('uses a spring for changing demo KPI values', () => {
    expect(getAnimatedMetricTransition(false)).toEqual({
      type: 'spring',
      stiffness: 280,
      damping: 34,
      mass: 0.7,
    })
  })

  it('jumps immediately when reduced motion is enabled', () => {
    expect(getAnimatedMetricTransition(true)).toEqual({ duration: 0 })
  })
})
