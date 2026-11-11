import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import { AdminForm } from './admin-form'

it('provides company subscription and contact fields', () => {
  const html = renderToStaticMarkup(
    <AdminForm
      resource="companies"
      busy={false}
      onSubmit={vi.fn()}
      currentUserId={1}
    />,
  )
  expect(html).toContain('name="subscription_starts_at"')
  expect(html).toContain('name="subscription_ends_at"')
  expect(html).toContain('Телефоны')
  expect(html).toContain('Мессенджеры')
})
it('does not populate the integration password when editing', () => {
  const html = renderToStaticMarkup(
    <AdminForm
      resource="integrations"
      item={{ id: 1, name: 'Base', company_id: 2, is_active: true }}
      busy={false}
      onSubmit={vi.fn()}
      currentUserId={1}
    />,
  )
  expect(html).toMatch(/name="password"[^>]*type="password"[^>]*value=""/)
  expect(html).toContain('База активна')
  expect(html).not.toContain('name="company_id"')
})
it('disables self role editing and form submissions while busy', () => {
  const html = renderToStaticMarkup(
    <AdminForm
      resource="users"
      item={{
        id: 1,
        name: 'Admin',
        role: { id: 1, name: 'admin', label: 'Admin' },
      }}
      busy
      onSubmit={vi.fn()}
      currentUserId={1}
    />,
  )
  expect(html).toContain('<fieldset disabled=""')
  expect(html).toContain('<select disabled=""')
})
it('lets the administrator pick a company by name when adding a database', () => {
  const html = renderToStaticMarkup(
    <AdminForm
      resource="integrations"
      busy={false}
      onSubmit={vi.fn()}
      currentUserId={1}
      companies={[
        { id: 4, name: 'Альфа' },
        { id: 9, name: 'Ярмарка' },
      ]}
    />,
  )
  expect(html).toMatch(/<select name="company_id"/)
  expect(html).toContain('<option value="4">Альфа</option>')
  expect(html).toContain('<option value="9">Ярмарка</option>')
  expect(html).not.toContain('ID компании')
})
