import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

interface Options {
  /** Animation duration in ms. */
  duration?: number
  /** Decimal places to round to during the tween. */
  decimals?: number
}

/**
 * Tweens a number from its previous value up to `target` using requestAnimationFrame
 * with an ease-out curve. Returns the target instantly when the user prefers
 * reduced motion.
 */
export function useCountUp(target: number, { duration = 800, decimals = 0 }: Options = {}) {
  const reduce = useReducedMotion()
  const [value, setValue] = useState(reduce ? target : 0)
  const fromRef = useRef(0)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (reduce || !Number.isFinite(target)) {
      setValue(target)
      fromRef.current = target
      return
    }

    const from = fromRef.current
    const start = performance.now()
    const factor = 10 ** decimals

    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setValue(Math.round((from + (target - from) * eased) * factor) / factor)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, decimals, reduce])

  return value
}
