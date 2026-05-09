import { motion, useReducedMotion } from 'framer-motion'
import { slideUp } from '@/shared/utils/motion'
import type { CompetitionLift, LiftPrEvent } from '../../types'

interface PrEventWithLift extends LiftPrEvent {
  lift: CompetitionLift
}

interface Props {
  events: PrEventWithLift[]
  /** Optional cap on rendered rows; defaults to 12 most recent. */
  limit?: number
}

export function PrTimeline({ events, limit = 12 }: Props) {
  const shouldReduce = useReducedMotion()
  const rows = events.slice(0, limit)

  return (
    <motion.ol
      initial={shouldReduce ? false : 'hidden'}
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
      className="space-y-2"
    >
      {rows.map((ev, i) => (
        <motion.li
          key={`${ev.lift}-${ev.date}-${i}`}
          variants={slideUp}
          className="flex items-center justify-between rounded-xl px-3 py-2"
          style={{ background: 'var(--bg-3)', border: '1px solid var(--border-1)' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ background: liftAccent(ev.lift, 0.16), color: liftAccent(ev.lift, 1) }}
            >
              {ev.lift}
            </span>
            <div className="text-sm text-text">
              {ev.weight.toFixed(1)} kg × {ev.reps}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-text">{ev.e1Rm.toFixed(1)} kg</p>
            <p className="text-[10px] text-muted">e1RM · {ev.date}</p>
          </div>
        </motion.li>
      ))}
    </motion.ol>
  )
}

function liftAccent(lift: CompetitionLift, alpha: number): string {
  const base =
    lift === 'Squat'
      ? 'var(--color-primary)'
      : lift === 'Bench'
        ? 'var(--color-warning)'
        : 'var(--color-success)'
  if (alpha === 1) return base
  // Recharts/Tailwind theme tokens are CSS variables; we need rgba-style fades for chips.
  if (lift === 'Squat') return `rgba(99,102,241,${alpha})`
  if (lift === 'Bench') return `rgba(245,158,11,${alpha})`
  return `rgba(34,197,94,${alpha})`
}
