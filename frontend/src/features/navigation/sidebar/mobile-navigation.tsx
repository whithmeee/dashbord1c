import { ChevronDown } from 'lucide-react'
import type { SidebarController } from './use-sidebar'
import './mobile-navigation.css'

export function MobileNavigation({
  controller,
}: {
  controller: SidebarController
}) {
  const active = controller.visibleSections.find(({ id }) =>
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
            const section = controller.visibleSections.find(
              ({ id }) => id === event.target.value,
            )
            if (section) controller.selectSection(section.id)
          }}
          data-testid="mobile-navigation"
        >
          {controller.visibleSections.map(({ id, label }) => (
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
