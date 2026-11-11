import { useEffect } from 'react'
import { motion, useSpring, useTransform } from 'motion/react'
import { formatMoney, unavailableMark } from './money-format'
import { getAnimatedMetricTransition } from './animated-metric-motion'

export function AnimatedMetricValue({
  amount,
  reducedMotion,
  masked = false,
}: {
  amount: number
  reducedMotion: boolean
  masked?: boolean
}) {
  const value = useSpring(amount, getAnimatedMetricTransition(reducedMotion))
  const formattedValue = useTransform(value, formatMoney)

  useEffect(() => {
    if (reducedMotion) {
      value.jump(amount)
      return
    }

    value.set(amount)
  }, [amount, reducedMotion, value])

  if (masked) {
    return <span>{unavailableMark}</span>
  }

  return <motion.span>{formattedValue}</motion.span>
}
