import { motion } from 'motion/react'
import { useInterfaceMotion } from '../../../shared/motion/use-interface-motion'
import './sidebar-connection.css'

export function SidebarConnection({ name }: { name: string }) {
  const { reducedMotion, appearance } = useInterfaceMotion()

  return (
    <footer className="sidebar-connection" data-testid="sidebar-connection">
      <motion.div
        className="sidebar-connection-card"
        initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={appearance}
      >
        <span className="sidebar-connection-logo" aria-hidden="true">
          1С
        </span>
        <div className="sidebar-connection-copy">
          <strong>{name}</strong>
          <span className="sidebar-connection-status" role="status">
            <span className="sidebar-connection-dot" aria-hidden="true" />
            Подключено
          </span>
        </div>
      </motion.div>
    </footer>
  )
}
