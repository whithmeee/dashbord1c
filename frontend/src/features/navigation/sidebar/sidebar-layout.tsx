import { useSyncExternalStore, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useInterfaceMotion } from '../../../shared/motion/use-interface-motion'
import './sidebar-layout.css'

const mobileQuery = '(max-width: 760px)'

function subscribeToViewport(callback: () => void) {
  const query = window.matchMedia(mobileQuery)
  query.addEventListener('change', callback)
  return () => query.removeEventListener('change', callback)
}

export function SidebarToggle({
  open,
  onToggle,
  section,
}: {
  open: boolean
  onToggle: () => void
  section: string
}) {
  const label = open ? 'Скрыть боковую панель' : 'Показать боковую панель'
  return (
    <header className="application-toolbar">
      <button
        className="sidebar-toggle"
        type="button"
        onClick={onToggle}
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls="application-sidebar"
        data-testid="sidebar-toggle"
      >
        {open ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
      </button>
      <span>{section}</span>
    </header>
  )
}

export function SidebarLayout({
  open,
  children,
}: {
  open: boolean
  children: ReactNode
}) {
  const mobile = useSyncExternalStore(
    subscribeToViewport,
    () => window.matchMedia(mobileQuery).matches,
    () => false,
  )
  const { reducedMotion } = useInterfaceMotion()
  const transition = reducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, bounce: 0, duration: 0.32 }

  return (
    <motion.div
      id="application-sidebar"
      className="sidebar-slot"
      initial={false}
      animate={{
        width: mobile ? '100%' : open ? 302 : 0,
        height: mobile ? (open ? 76 : 0) : '100%',
      }}
      transition={transition}
      aria-hidden={!open}
      {...(!open ? { inert: '' } : {})}
      data-testid="sidebar-slot"
    >
      <motion.div
        className="sidebar-frame"
        initial={false}
        animate={{
          x: reducedMotion || mobile ? 0 : open ? 0 : -32,
          opacity: open ? 1 : 0,
        }}
        transition={transition}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
