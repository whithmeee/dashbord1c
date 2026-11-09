import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CabinetViewerIdentity } from './cabinet-viewer'

describe('CabinetViewerIdentity', () => {
  it('shows the signed-in employee and position', () => {
    const html = renderToStaticMarkup(
      <CabinetViewerIdentity viewer={{ type: 'employee', name: 'Иван Петров', position: 'Бухгалтер' }} />,
    )

    expect(html).toContain('Вы вошли как')
    expect(html).toContain('Иван Петров')
    expect(html).toContain('Бухгалтер')
  })

  it('labels a company viewer as the owner', () => {
    const html = renderToStaticMarkup(
      <CabinetViewerIdentity viewer={{ type: 'company', name: 'ООО Ромашка', position: null }} />,
    )

    expect(html).toContain('ООО Ромашка')
    expect(html).toContain('Владелец компании')
  })
})
