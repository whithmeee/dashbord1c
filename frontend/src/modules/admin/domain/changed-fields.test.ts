import { expect, it } from 'vitest'
import { changedFields } from './changed-fields'

it('omits unchanged fields and a blank integration password from PATCH', () => {
  expect(
    changedFields(
      { name: 'New', password: '', email: 'same@site.test', phones: [] },
      { name: 'Old', password: '', email: 'same@site.test', phones: [] },
    ),
  ).toEqual({ name: 'New' })
})
it('retains explicit contact removal and changed password', () => {
  expect(
    changedFields(
      { phones: [], password: 'new' },
      { phones: [{ phone: '123' }], password: '' },
    ),
  ).toEqual({ phones: [], password: 'new' })
})
