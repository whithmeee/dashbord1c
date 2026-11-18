import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DashboardGlassBackground } from './dashboard-glass-background'

describe('dashboard liquid glass background', () => {
  it('renders a scoped refraction filter behind the dashboard content', () => {
    const markup = renderToStaticMarkup(<DashboardGlassBackground />)

    expect(markup).toContain('dashboard-liquid-glass-filter')
    expect(markup).toContain('<feGaussianBlur')
    expect(markup).toContain('<feDisplacementMap')
    expect(markup).toContain('dashboard-glass-wall')
    expect(markup).toContain('dashboard-glass-refraction')
  })
})
