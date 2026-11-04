import { describe, expect, it } from 'vitest'
import { buildApiUrl, resolveApiBaseUrl } from './api-config'

describe('API configuration', () => {
  it('uses same-origin when the environment value is absent', () => {
    expect(resolveApiBaseUrl(undefined)).toBe('')
  })

  it('normalizes an absolute HTTP API URL', () => {
    expect(resolveApiBaseUrl('http://127.0.0.1:56331/')).toBe(
      'http://127.0.0.1:56331',
    )
  })

  it('rejects unsupported or credential-bearing URLs', () => {
    expect(() => resolveApiBaseUrl('ftp://api.example.test')).toThrow(
      'VITE_API_BASE_URL',
    )
    expect(() => resolveApiBaseUrl('https://user:pass@example.test')).toThrow(
      'VITE_API_BASE_URL',
    )
  })

  it('builds same-origin and cross-origin request URLs', () => {
    expect(buildApiUrl('', '/api/chats')).toBe('/api/chats')
    expect(buildApiUrl('https://api.example.test', 'auth/me')).toBe(
      'https://api.example.test/auth/me',
    )
  })

  it('rejects absolute request paths', () => {
    expect(() => buildApiUrl('', 'https://unexpected.test')).toThrow(
      'relative API path',
    )
  })
})
