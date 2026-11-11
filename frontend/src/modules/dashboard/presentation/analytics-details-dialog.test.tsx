import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { DocumentsPagination } from './analytics-details-dialog'

describe('analytics details pagination', () => {
  it('renders bounded document navigation', () => {
    const markup = renderToStaticMarkup(
      <DocumentsPagination page={2} lastPage={3} onPage={vi.fn()} />,
    )

    expect(markup).toContain('Предыдущая')
    expect(markup).toContain('Страница 2 из 3')
    expect(markup).toContain('Следующая')
  })
})
