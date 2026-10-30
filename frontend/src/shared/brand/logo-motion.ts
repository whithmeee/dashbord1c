import type { Variants } from 'motion/react'

export const logoMotion = {
  ease: [0.22, 1, 0.36, 1] as const,
  icon: { duration: 0.78, delay: 0, rise: 12 },
  name: { duration: 0.65, delay: 0.2, rise: 6 },
  project: { duration: 0.62, delay: 0.38, rise: 4 },
  greeting: { lift: 3, rotation: 2, outward: 0.22, return: 0.36 },
  rest: 'translateY(0px) rotate(0deg) scale(1)',
}

export function logoVariants(part: 'icon' | 'name' | 'project'): Variants {
  const { rise, duration, delay } = logoMotion[part]
  return {
    hidden: {
      opacity: 0,
      transform: `translateY(${rise}px) rotate(${part === 'icon' ? -3 : 0}deg) scale(${part === 'icon' ? 0.94 : 1})`,
    },
    visible: {
      opacity: 1,
      transform: logoMotion.rest,
      transition: { duration, delay, ease: logoMotion.ease },
    },
  }
}
