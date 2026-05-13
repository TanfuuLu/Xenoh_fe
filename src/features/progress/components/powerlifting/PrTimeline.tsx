import { motion, useReducedMotion } from 'framer-motion'
import { slideUp } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
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
  const tp = useT().progress
  const rows = events.slice(0, limit)
  const scrollable = rows.length > 5

  return (
    <div
      className={scrollable ? 'max-h-[340px] overflow-y-auto pr-1' : undefined}
      aria-label={scrollable ? tp.scrollablePrTimeline : undefined}
    >
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
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ background: liftAccent(ev.lift, 0.16), color: liftAccent(ev.lift, 1) }}
              >
                {translateLift(ev.lift, tp)}
              </span>
              <div className="truncate text-sm text-text">
                {ev.weight.toFixed(1)} {tp.kgUnit} x {ev.reps}
              </div>
            </div>
            <div className="shrink-0 pl-3 text-right">
              <p className="text-sm font-semibold text-text">{ev.e1Rm.toFixed(1)} {tp.kgUnit}</p>
              <p className="text-[10px] text-muted">{tp.e1rm} - {ev.date}</p>
            </div>
          </motion.li>
        ))}
      </motion.ol>
    </div>
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

function translateLift(lift: CompetitionLift, tp: Record<string, string>) {
  if (lift === 'Squat') return tp.squat
  if (lift === 'Bench') return tp.bench
  return tp.deadlift
}
