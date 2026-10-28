import type { CSSProperties } from 'react'
import {
  ChevronDown,
  Layers3,
  MoreHorizontal,
  ShieldCheck,
} from 'lucide-react'
import osminogLogo from '../../../assets/osminog-company-logo.svg'
import { sidebarSections } from './sidebar.config'
import type { SidebarController } from './use-sidebar'
import './sidebar.css'
import './sidebar-motion.css'

type SidebarProps = {
  controller: SidebarController
}

export function Sidebar({ controller }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">
          <img src={osminogLogo} alt="Osminog" />
        </span>
        <span className="sidebar-product">Личный кабинет</span>
      </div>

      <div className="workspace-control">
        <button
          className="workspace-trigger"
          type="button"
          aria-expanded={controller.isWorkspaceMenuOpen}
          onClick={controller.toggleWorkspaceMenu}
        >
          <span className="workspace-icon">
            <Layers3 size={18} />
          </span>
          <span className="workspace-copy">
            <strong>Основное пространство</strong>
            <small>Мой проект</small>
          </span>
          <ChevronDown className="workspace-chevron" size={18} />
        </button>

        {controller.isWorkspaceMenuOpen && (
          <div className="workspace-menu">
            <button type="button">Основное пространство</button>
          </div>
        )}
      </div>

      <span className="sidebar-section-label">Рабочее пространство</span>

      <nav className="sidebar-navigation" aria-label="Основная навигация">
        {sidebarSections.map(({ id, label, icon: Icon }, index) => (
          <button
            className="sidebar-navigation-item"
            style={{ '--item-index': index } as CSSProperties}
            type="button"
            aria-current={controller.isSectionActive(id) ? 'page' : undefined}
            onClick={() => controller.selectSection(id)}
            key={id}
          >
            <span className="sidebar-navigation-icon">
              <Icon size={20} />
            </span>
            <span>{label}</span>
            <span className="sidebar-active-dot" />
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-security">
          <ShieldCheck className="sidebar-security-icon" size={18} />
          <span>
            <strong>Контроль в ваших руках</strong>
            <small>
              Интеграции и доступы настраивает администратор пространства.
            </small>
          </span>
        </div>

        <button className="sidebar-profile" type="button">
          <span className="sidebar-avatar">АК</span>
          <span className="sidebar-profile-copy">
            <strong>Алексей Ковалёв</strong>
            <small>Личный кабинет</small>
          </span>
          <MoreHorizontal size={18} />
        </button>
      </div>
    </aside>
  )
}
