import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DemoNotice } from './demo-controls'

describe('demo dashboard notice', () => {
  it('labels the dashboard as demonstration data', () => {
    const markup = renderToStaticMarkup(<DemoNotice />)

    expect(markup).toContain('Демонстрационные данные')
  })
})
