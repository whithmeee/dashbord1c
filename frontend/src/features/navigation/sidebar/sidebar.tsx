import { useState } from 'react'
import { LayoutGroup, motion } from 'motion/react'
import { LogOut } from 'lucide-react'
import { useInterfaceMotion } from '../../../shared/motion/use-interface-motion'
import { OsminogLogo } from '../../../shared/brand/osminog-logo'
import { SidebarToggle } from './sidebar-toggle'
import { sidebarSections } from './sidebar.config'
import type { SidebarController } from './use-sidebar'
import './sidebar.css'
import './sidebar-motion.css'

type SidebarProps = {
  controller: SidebarController
  onLogout: () => Promise<void>
  logoutError?: string
}

export function Sidebar({ controller, onLogout, logoutError }: SidebarProps) {
  const { movement } = useInterfaceMotion()
  const [loggingOut, setLoggingOut] = useState(false)

  async function logout() {
    if (loggingOut) {
      return
    }
    setLoggingOut(true)
    await onLogout().catch(() => undefined)
    setLoggingOut(false)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <OsminogLogo size={192} />
        {controller.isSidebarOpen && (
          <SidebarToggle open onToggle={controller.toggleSidebar} />
        )}
      </div>

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
      <button
        className="sidebar-logout"
        type="button"
        disabled={loggingOut}
        onClick={logout}
        data-testid="logout"
      >
        <LogOut size={18} aria-hidden="true" />
        <span>{loggingOut ? 'Выходим…' : 'Выйти'}</span>
      </button>
      {logoutError && <p className="sidebar-logout-error">{logoutError}</p>}
    </aside>
  )
}
