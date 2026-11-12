import { useEffect, useState } from 'react'

export function useScanProgress(active: boolean): number {
  const [progress, setProgress] = useState(active ? 8 : 100)

  useEffect(() => {
    if (!active) {
      setProgress(100)
      return
    }

    setProgress(8)
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(92, current + Math.max(1, Math.round((92 - current) * 0.12))))
    }, 240)

    return () => window.clearInterval(timer)
  }, [active])

  return progress
}
