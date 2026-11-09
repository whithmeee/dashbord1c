export const dashboardFilterMotion = {
  layoutId: 'period-selection',
  transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const },
} as const

export function getDashboardDetailsTransition(reducedMotion: boolean) {
  return reducedMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.23, 1, 0.32, 1] as const }
}
