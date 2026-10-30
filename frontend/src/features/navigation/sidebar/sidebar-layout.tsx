import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { useInterfaceMotion } from '../../../shared/motion/use-interface-motion'
import './sidebar-layout.css'

export function SidebarLayout({
  open,
  children,
}: {
  open: boolean
  children: ReactNode
}) {
  const { reducedMotion, appearance } = useInterfaceMotion()

  return (
    <div
      id="application-sidebar"
      className="sidebar-slot"
      data-open={open}
      aria-hidden={!open}
      {...(!open ? { inert: '' } : {})}
      data-testid="sidebar-slot"
    >
      <motion.div
        className="sidebar-frame"
        initial={false}
        animate={{
          transform:
            reducedMotion || open ? 'translateX(0)' : 'translateX(-12px)',
          opacity: open ? 1 : 0,
        }}
        transition={appearance}
      >
        {children}
      </motion.div>
    </div>
  )
}
