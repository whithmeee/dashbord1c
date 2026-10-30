import { useEffect, useRef, type PointerEvent } from 'react'
import { useAnimationControls, useInView, useReducedMotion } from 'motion/react'
import { logoMotion } from './logo-motion'

export function useLogoMotion(animated: boolean, hover: boolean) {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.25 })
  const reducedMotion = useReducedMotion()
  const enabled = animated && !reducedMotion
  const icon = useAnimationControls()
  const text = useAnimationControls()
  const finished = useRef(false)
  const ready = useRef(false)
  const greeting = useRef(0)

  useEffect(() => {
    let active = true
    if (!enabled || finished.current) {
      icon.set({ opacity: 1, transform: logoMotion.rest })
      text.set({ opacity: 1, transform: logoMotion.rest })
      finished.current = true
      ready.current = true
    } else if (inView) {
      void Promise.all([icon.start('visible'), text.start('visible')]).then(
        () => {
          if (!active) return
          finished.current = true
          ready.current = true
        },
      )
    }
    return () => {
      active = false
      ready.current = false
      greeting.current += 1
      icon.stop()
      text.stop()
    }
  }, [enabled, inView, icon, text])

  async function greet(event: PointerEvent<SVGSVGElement>) {
    if (!enabled || !hover || !ready.current || event.pointerType !== 'mouse')
      return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const current = ++greeting.current
    const { lift, rotation, outward, return: settle } = logoMotion.greeting
    await icon.start({
      transform: `translateY(-${lift}px) rotate(${rotation}deg) scale(1)`,
      transition: { duration: outward, ease: logoMotion.ease },
    })
    if (current !== greeting.current) return
    await icon.start({
      transform: logoMotion.rest,
      transition: { duration: settle, ease: logoMotion.ease },
    })
  }

  return { ref, icon, text, greet, initial: enabled ? 'hidden' : 'visible' }
}
