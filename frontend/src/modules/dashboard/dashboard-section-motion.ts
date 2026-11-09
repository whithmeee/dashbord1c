export const dashboardSectionMotion = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
} as const

export function getDashboardSectionTransition(reducedMotion: boolean) {
  return reducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const }
}
