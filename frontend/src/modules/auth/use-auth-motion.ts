import type { PointerEvent } from 'react'
import { useMotionValue, useSpring } from 'motion/react'
import { useInterfaceMotion } from '../../shared/motion/use-interface-motion'

export function useAuthMotion() {
  const { reducedMotion } = useInterfaceMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(x, { stiffness: 180, damping: 26 })
  const rotateY = useSpring(y, { stiffness: 180, damping: 26 })

  function resetTilt() {
    x.set(0)
    y.set(0)
  }

  function followPointer(event: PointerEvent<HTMLElement>) {
    if (reducedMotion || event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    x.set((0.5 - (event.clientY - bounds.top) / bounds.height) * 3)
    y.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 3)
  }

  return {
    style: {
      rotateX: reducedMotion ? 0 : rotateX,
      rotateY: reducedMotion ? 0 : rotateY,
    },
    followPointer,
    resetTilt,
  }
}
