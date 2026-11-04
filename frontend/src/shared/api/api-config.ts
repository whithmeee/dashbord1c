const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+.-]*:/i

export function resolveApiBaseUrl(configuredUrl: string | undefined): string {
  const value = configuredUrl?.trim()

  if (!value) {
    return ''
  }

  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw new Error('VITE_API_BASE_URL must be an absolute HTTP URL')
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    url.search.length > 0 ||
    url.hash.length > 0
  ) {
    throw new Error('VITE_API_BASE_URL must be a safe absolute HTTP URL')
  }

  return url.toString().replace(/\/$/, '')
}

export function buildApiUrl(baseUrl: string, path: string): string {
  if (ABSOLUTE_URL_PATTERN.test(path)) {
    throw new Error('Expected a relative API path')
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${baseUrl}${normalizedPath}`
}
