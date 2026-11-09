import { describe, expect, it } from 'vitest'
import { createReportChartOptions } from './chart-presentation'

describe('report chart animation', () => {
  it('uses a calm initial draw and a shorter dataset update', () => {
    const options = createReportChartOptions(false)

    expect(options.animation).toMatchObject({ duration: 520, easing: 'easeOutCubic' })
    expect(options.transitions?.default?.animation).toMatchObject({ duration: 380 })
    expect(options.transitions?.resize?.animation).toMatchObject({ duration: 0 })
    expect(options.transitions?.active?.animation).toMatchObject({ duration: 0 })
  })

  it('disables all chart motion for reduced motion', () => {
    const options = createReportChartOptions(true)

    expect(options.animation).toBe(false)
    expect(options.transitions?.default?.animation).toMatchObject({ duration: 0 })
  })
})
