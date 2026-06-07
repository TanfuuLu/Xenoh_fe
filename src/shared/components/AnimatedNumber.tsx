import { useCountUp } from '@/shared/hooks/useCountUp'

interface Props {
  value: number
  decimals?: number
  duration?: number
  prefix?: string
  suffix?: string
  /** Custom formatter for the tweened value; overrides decimals-based formatting. */
  format?: (n: number) => string
  className?: string
}

/**
 * Renders a number that counts up to `value` on mount (and on change),
 * respecting reduced-motion preferences. See {@link useCountUp}.
 */
export function AnimatedNumber({ value, decimals = 0, duration, prefix = '', suffix = '', format, className }: Props) {
  const n = useCountUp(value, { duration, decimals })
  const text = format
    ? format(n)
    : n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return <span className={className}>{prefix}{text}{suffix}</span>
}
