export const dashboardCardMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  reducedInitial: { opacity: 1, y: 0 },
  hover: { y: -3 },
  staggerStep: 0.05,
  duration: 0.22,
} as const

export function getDashboardCardTransition(reducedMotion: boolean, index: number) {
  if (reducedMotion) return { duration: 0, delay: 0 }
  return {
    duration: dashboardCardMotion.duration,
    delay: Number((Math.min(Math.max(index, 0), 4) * dashboardCardMotion.staggerStep).toFixed(2)),
    ease: [0.23, 1, 0.32, 1] as const,
  }
}
