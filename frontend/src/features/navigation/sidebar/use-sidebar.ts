import { useCallback, useMemo, useState } from 'react'
import { allowEverySection, type SectionAccess } from '../../../modules/auth/domain/section-access'
import { sidebarSections, type SidebarSectionId } from './sidebar.config'

export function useSidebar(access: SectionAccess = allowEverySection) {
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), [])
  const [activeSectionId, setActiveSectionId] =
    useState<SidebarSectionId>('cabinet')

  const activeSectionLabel = useMemo(() => {
    const section = sidebarSections.find(({ id }) => id === activeSectionId)
    return section?.screenLabel ?? section?.label ?? sidebarSections[0].label
  }, [activeSectionId])

  const visibleSections = useMemo(
    () => sidebarSections.filter((section) => !('section' in section) || access(section.section)),
    [access],
  )

  const isSectionVisible = useCallback(
    (sectionId: SidebarSectionId) => visibleSections.some(({ id }) => id === sectionId),
    [visibleSections],
  )

  const selectSection = useCallback(
    (sectionId: SidebarSectionId) => {
      if (isSectionVisible(sectionId)) {
        setActiveSectionId(sectionId)
      }
    },
    [isSectionVisible],
  )

  const isSectionActive = useCallback(
    (sectionId: SidebarSectionId) => activeSectionId === sectionId,
    [activeSectionId],
  )

  return {
    isSidebarOpen,
    toggleSidebar,
    activeSectionLabel,
    isSectionActive,
    isSectionVisible,
    visibleSections,
    selectSection,
  }
}

export type SidebarController = ReturnType<typeof useSidebar>
