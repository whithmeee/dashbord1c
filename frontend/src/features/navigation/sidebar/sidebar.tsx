import { LayoutGroup, motion } from 'motion/react'
import { useInterfaceMotion } from '../../../shared/motion/use-interface-motion'
import osminogLogo from '../../../assets/osminog-company-logo.svg'
import { SidebarToggle } from './sidebar-toggle'
import { SidebarConnection } from './sidebar-connection'
import { demoSidebarConnection, sidebarSections } from './sidebar.config'
import type { SidebarController } from './use-sidebar'
import './sidebar.css'
import './sidebar-motion.css'

type SidebarProps = {
  controller: SidebarController
}

export function Sidebar({ controller }: SidebarProps) {
  const { movement } = useInterfaceMotion()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">
          <img src={osminogLogo} alt="Osminog" />
        </span>
        {controller.isSidebarOpen && (
          <SidebarToggle open onToggle={controller.toggleSidebar} />
        )}
      </div>

      <span className="sidebar-section-label">Рабочее пространство</span>

      <LayoutGroup id="sidebar">
        <nav className="sidebar-navigation" aria-label="Основная навигация">
          {sidebarSections.map(({ id, label, icon: Icon }) => (
            <button
              className="sidebar-navigation-item"
              type="button"
              aria-current={controller.isSectionActive(id) ? 'page' : undefined}
              onClick={() => controller.selectSection(id)}
              key={id}
              data-testid={`navigation-${id}`}
            >
              {controller.isSectionActive(id) && (
                <motion.span
                  className="sidebar-selection"
                  layoutId="selection"
                  transition={movement}
                  aria-hidden="true"
                />
              )}
              <span className="sidebar-navigation-icon">
                <Icon size={20} />
              </span>
              <span>{label}</span>
              <span className="sidebar-active-dot" />
            </button>
          ))}
        </nav>
      </LayoutGroup>
      {demoSidebarConnection.connected && (
        <SidebarConnection name={demoSidebarConnection.name} />
      )}
    </aside>
  )
}
