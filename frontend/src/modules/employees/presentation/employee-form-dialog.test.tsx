import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { EmployeeForm } from './employee-form'

describe('EmployeeForm dialog', () => {
  it('renders the create form as an accessible modal dialog', () => {
    const html = renderToStaticMarkup(
      <EmployeeForm pending={false} onSubmit={vi.fn()} onClose={vi.fn()} />,
    )

    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toContain('Новый сотрудник')
  })
})
