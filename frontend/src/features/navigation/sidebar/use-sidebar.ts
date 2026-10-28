import { useCallback, useMemo, useState } from 'react'
import {
  sidebarSections,
  type SidebarSectionId,
} from './sidebar.config'

export function useSidebar() {
  const [activeSectionId, setActiveSectionId] =
    useState<SidebarSectionId>('cabinet')
  const [isWorkspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)

  const activeSectionLabel = useMemo(
    () =>
      sidebarSections.find((section) => section.id === activeSectionId)?.label ??
      sidebarSections[0].label,
    [activeSectionId],
  )

  const selectSection = useCallback((sectionId: SidebarSectionId) => {
    setActiveSectionId(sectionId)
  }, [])

  const toggleWorkspaceMenu = useCallback(() => {
    setWorkspaceMenuOpen((isOpen) => !isOpen)
  }, [])

  const isSectionActive = useCallback(
    (sectionId: SidebarSectionId) => activeSectionId === sectionId,
    [activeSectionId],
  )

  return {
    activeSectionLabel,
    isSectionActive,
    isWorkspaceMenuOpen,
    selectSection,
    toggleWorkspaceMenu,
  }
}

export type SidebarController = ReturnType<typeof useSidebar>
