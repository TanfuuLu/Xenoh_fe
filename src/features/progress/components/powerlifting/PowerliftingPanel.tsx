import { motion, useReducedMotion } from 'framer-motion'
import { Activity, Award, Dumbbell, TrendingUp } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { OneRepMaxCalculator } from '@/shared/components/OneRepMaxCalculator'
import { slideUp } from '@/shared/utils/motion'
import type { LiftSeries, PowerliftingSection } from '../../types'
import { LiftTrendChart } from './LiftTrendChart'
import { PrTimeline } from './PrTimeline'
import { DotsOverTimeChart } from './DotsOverTimeChart'

interface Props {
  section: PowerliftingSection
}

export function PowerliftingPanel({ section }: Props) {
  const shouldReduce = useReducedMotion()
  const lifts: LiftSeries[] = [section.squat, section.bench, section.deadlift]
  const allPrs = lifts
    .flatMap((l) => l.prTimeline.map((pr) => ({ ...pr, lift: l.lift })))
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <div className="space-y-6">
      {/* Training-max stat cards */}
      <motion.div
        initial={shouldReduce ? false : 'hidden'}
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {lifts.map((l) => (
          <TrainingMaxCard key={l.lift} lift={l} shouldReduce={!!shouldReduce} />
        ))}
      </motion.div>

      {/* Lift trend */}
      <motion.div {...(shouldReduce ? {} : slideUp)}>
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={17} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-base font-semibold text-text">Estimated 1RM trend</h2>
          </div>
          {lifts.every((l) => l.e1Rm.length === 0) ? (
            <p className="text-sm text-muted">
              Log at least one completed set on a competition lift to start the trend.
            </p>
          ) : (
            <LiftTrendChart squat={section.squat} bench={section.bench} deadlift={section.deadlift} />
          )}
        </Card>
      </motion.div>

      {/* PR timeline + DOTS over time */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div {...(shouldReduce ? {} : slideUp)}>
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Award size={17} style={{ color: 'var(--color-primary)' }} />
              <h2 className="text-base font-semibold text-text">PR timeline</h2>
            </div>
            {allPrs.length === 0 ? (
              <p className="text-sm text-muted">No PRs logged yet.</p>
            ) : (
              <PrTimeline events={allPrs} />
            )}
          </Card>
        </motion.div>

        <motion.div {...(shouldReduce ? {} : slideUp)}>
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Activity size={17} style={{ color: 'var(--color-primary)' }} />
              <h2 className="text-base font-semibold text-text">DOTS over time</h2>
            </div>
            {section.dots.length === 0 ? (
              <p className="text-sm text-muted">
                DOTS needs all three lifts plus a bodyweight log. Add bodyweight entries to see the curve.
              </p>
            ) : (
              <DotsOverTimeChart points={section.dots} />
            )}
          </Card>
        </motion.div>
      </div>

      {/* 1RM calculator */}
      <motion.div {...(shouldReduce ? {} : slideUp)}>
        <OneRepMaxCalculator />
      </motion.div>
    </div>
  )
}

function TrainingMaxCard({ lift, shouldReduce }: { lift: LiftSeries; shouldReduce: boolean }) {
  const accent =
    lift.lift === 'Squat'
      ? 'var(--color-primary)'
      : lift.lift === 'Bench'
        ? 'var(--color-warning)'
        : 'var(--color-success)'

  return (
    <motion.div
      variants={slideUp}
      initial={shouldReduce ? false : 'hidden'}
      animate="visible"
      className="rounded-2xl p-4"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
    >
      <div className="mb-2 flex items-center gap-2" style={{ color: accent }}>
        <Dumbbell size={18} />
        <span className="text-xs font-medium text-muted">{lift.lift}</span>
        {lift.isPlateau && (
          <span
            className="ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-medium"
            style={{ background: 'rgba(245,158,11,0.16)', color: 'var(--color-warning)' }}
          >
            plateau
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-text">
          {lift.currentE1Rm === null ? '—' : `${lift.currentE1Rm.toFixed(1)} kg`}
        </p>
        <span className="text-xs text-muted">e1RM</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Training max:{' '}
        <span className="font-semibold text-text">
          {lift.currentTrainingMax === null ? '—' : `${lift.currentTrainingMax.toFixed(1)} kg`}
        </span>
      </p>
    </motion.div>
  )
}
