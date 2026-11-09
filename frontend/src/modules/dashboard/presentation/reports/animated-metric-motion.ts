export function getAnimatedMetricTransition(reducedMotion: boolean) {
  return reducedMotion
    ? { duration: 0 }
    : {
        type: 'spring' as const,
        stiffness: 280,
        damping: 34,
        mass: 0.7,
      }
}
