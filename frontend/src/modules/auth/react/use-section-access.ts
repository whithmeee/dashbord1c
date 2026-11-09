import { useSyncExternalStore } from 'react'
import { sectionAccessFor, type SectionAccess } from '../domain/section-access'
import { authSessionStore } from './auth-runtime'

export function useSectionAccess(): SectionAccess {
  const state = useSyncExternalStore(
    authSessionStore.subscribe,
    authSessionStore.getSnapshot,
    authSessionStore.getSnapshot,
  )

  return sectionAccessFor('session' in state ? state.session : undefined)
}
