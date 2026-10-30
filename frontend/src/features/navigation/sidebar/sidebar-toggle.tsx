import type { MouseEvent } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

export function SidebarToggle({
  open,
  onToggle,
}: {
  open: boolean
  onToggle: () => void
}) {
  const label = open ? 'Скрыть боковую панель' : 'Показать боковую панель'

  function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    const restoreFocus = document.activeElement === event.currentTarget
    onToggle()
    if (restoreFocus) {
      requestAnimationFrame(() => {
        document
          .getElementById('sidebar-toggle')
          ?.focus({ preventScroll: true })
      })
    }
  }

  return (
    <button
      id="sidebar-toggle"
      className="sidebar-toggle"
      type="button"
      onClick={handleToggle}
      aria-label={label}
      title={label}
      aria-expanded={open}
      aria-controls="application-sidebar"
      data-testid="sidebar-toggle"
    >
      {open ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
    </button>
  )
}
