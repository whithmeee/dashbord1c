import { describe, expect, it } from 'vitest'
import { innError, kppError } from './tax-numbers'

describe('tax numbers', () => {
  it('accepts valid ten and twelve digit INN', () => {
    expect(innError('7707083893')).toBeNull()
    expect(innError('500100732259')).toBeNull()
  })

  it('explains why an INN is rejected', () => {
    expect(innError('')).toBe('Введите ИНН.')
    expect(innError('77070838')).toContain('10 цифр')
    expect(innError('7707083894')).toContain('контрольная сумма')
    expect(innError('500100732258')).toContain('контрольная сумма')
  })

  it('accepts a KPP of nine characters and rejects anything else', () => {
    expect(kppError('770701001')).toBeNull()
    expect(kppError('7707AB001')).toBeNull()
    expect(kppError('')).toBe('Введите КПП.')
    expect(kppError('77070100')).toContain('9 символов')
  })
})
