import { useEffect } from 'react'
import { motion, useSpring, useTransform } from 'motion/react'
import { formatMoney } from './money-format'
import { getAnimatedMetricTransition } from './animated-metric-motion'

export function AnimatedMetricValue({
  amount,
  reducedMotion,
}: {
  amount: number
  reducedMotion: boolean
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

  return <motion.span>{formattedValue}</motion.span>
}
