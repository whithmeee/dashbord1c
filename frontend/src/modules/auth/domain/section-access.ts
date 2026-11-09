import type { AuthSession } from './auth-session'

export const sectionKeys = [
  'finance',
  'integrations',
  'analytics',
  'subscription',
  'system_status',
  'chat',
] as const

export type SectionKey = (typeof sectionKeys)[number]

export type SectionAccess = (section: SectionKey) => boolean

export const allowEverySection: SectionAccess = () => true

export function sectionAccessFor(session: AuthSession | undefined): SectionAccess {
  if (session?.type !== 'employee' || session.account.sections === undefined) {
    return allowEverySection
  }

  const granted: readonly string[] = session.account.sections

  return (section) => granted.includes(section)
}
