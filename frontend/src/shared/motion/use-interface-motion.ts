import { useReducedMotion, type Transition } from 'motion/react'

export function useInterfaceMotion() {
  const reducedMotion = useReducedMotion()
  const movement: Transition = reducedMotion
    ? { duration: 0 }
    : { type: 'spring', bounce: 0, duration: 0.25 }

  return {
    reducedMotion,
    movement,
    appearance: { duration: reducedMotion ? 0 : 0.16 },
  }
}
