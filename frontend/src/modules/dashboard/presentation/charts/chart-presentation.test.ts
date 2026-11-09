import { describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import {
  activePointCrosshairPlugin,
  createReportChartOptions,
} from './chart-presentation'

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

  it('selects the nearest x point and keeps the built-in tooltip', () => {
    const options = createReportChartOptions(false)

    expect(options.interaction).toEqual({ mode: 'index', intersect: false, axis: 'x' })
    expect(options.hover).toMatchObject({ mode: 'index', intersect: false })
    expect(options.plugins?.tooltip).toMatchObject({ mode: 'index', intersect: false })
  })

  it('draws a crosshair only while Chart.js has an active point', () => {
    const context = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      setLineDash: vi.fn(),
    }
    const chart = {
      ctx: context,
      chartArea: { top: 12, bottom: 96 },
      tooltip: { getActiveElements: () => [{ element: { x: 44 } }] },
      data: { datasets: [{ data: [10, 20] }] },
    }

    activePointCrosshairPlugin.afterDraw?.(chart as never, {} as never, {} as never)

    expect(context.moveTo).toHaveBeenCalledWith(44, 12)
    expect(context.lineTo).toHaveBeenCalledWith(44, 96)
    expect(chart.data.datasets[0].data).toEqual([10, 20])

    const emptyContext = {
      ...context,
      save: vi.fn(),
    }
    activePointCrosshairPlugin.afterDraw?.({
      ...chart,
      ctx: emptyContext,
      tooltip: { getActiveElements: () => [] },
    } as never, {} as never, {} as never)

    expect(emptyContext.save).not.toHaveBeenCalled()
  })
})
