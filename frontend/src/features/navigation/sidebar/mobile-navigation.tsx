import { ChevronDown } from 'lucide-react'
import { sidebarSections } from './sidebar.config'
import type { SidebarController } from './use-sidebar'
import './mobile-navigation.css'

export function MobileNavigation({
  controller,
}: {
  controller: SidebarController
}) {
  const active = sidebarSections.find(({ id }) =>
    controller.isSectionActive(id),
  )

  return (
    <div className="mobile-navigation">
      <span className="mobile-navigation-brand">Osminog Project</span>
      <div className="mobile-navigation-select">
        <select
          aria-label="Раздел приложения"
          value={active?.id}
          onChange={(event) => {
            const section = sidebarSections.find(
              ({ id }) => id === event.target.value,
            )
            if (section) controller.selectSection(section.id)
          }}
          data-testid="mobile-navigation"
        >
          {sidebarSections.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} aria-hidden="true" />
      </div>
    </div>
  )
}
