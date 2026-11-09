import { useReducedMotion, type Transition } from 'motion/react'

export function useInterfaceMotion() {
  const reducedMotion = useReducedMotion()
  const movement: Transition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.16, ease: [0.23, 1, 0.32, 1] }

  return {
    reducedMotion,
    movement,
    appearance: { duration: reducedMotion ? 0 : 0.16 },
  }
}
