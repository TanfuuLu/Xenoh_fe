import { motion, useReducedMotion } from 'framer-motion'
import { Activity, Award, Dumbbell, Gauge, Percent, TrendingUp, Zap } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { OneRepMaxCalculator } from '@/shared/components/OneRepMaxCalculator'
import { useT } from '@/shared/i18n'
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
  const tp = useT().progress
  const lifts: LiftSeries[] = [section.squat, section.bench, section.deadlift]
  const allPrs = lifts
    .flatMap((l) => l.prTimeline.map((pr) => ({ ...pr, lift: l.lift })))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  const analysis = buildPowerliftingAnalysis(section, tp)

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

      <motion.div {...(shouldReduce ? {} : slideUp)}>
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Gauge size={17} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-base font-semibold text-text">{tp.powerliftingAnalysisTitle}</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AnalysisMetric icon={<Dumbbell size={16} />} label={tp.totalEstimate} value={analysis.estimatedTotal} />
            <AnalysisMetric icon={<Gauge size={16} />} label={tp.totalTrainingMax} value={analysis.trainingMaxTotal} />
            <AnalysisMetric icon={<Percent size={16} />} label={tp.benchSquatRatio} value={analysis.benchSquatRatio} />
            <AnalysisMetric icon={<Percent size={16} />} label={tp.deadliftSquatRatio} value={analysis.deadliftSquatRatio} />
            <AnalysisMetric icon={<Award size={16} />} label={tp.prLast30} value={analysis.prsLast30} />
            <AnalysisMetric icon={<Zap size={16} />} label={tp.latestPr} value={analysis.latestPr} />
            <AnalysisMetric icon={<AlertIcon />} label={tp.plateauLifts} value={analysis.plateauLifts} />
            <AnalysisMetric icon={<Activity size={16} />} label={tp.bodyweightForDots} value={analysis.dotsBodyweight} />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {analysis.notes.map((note) => (
              <div key={note.title} className="rounded-xl border p-3" style={{ background: 'var(--bg-2)', borderColor: 'var(--border-1)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{note.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-text">{note.text}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Lift trend */}
      <motion.div {...(shouldReduce ? {} : slideUp)}>
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={17} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-base font-semibold text-text">{tp.estimatedOneRmTrend}</h2>
          </div>
          {lifts.every((l) => l.e1Rm.length === 0) ? (
            <p className="text-sm text-muted">
              {tp.logCompetitionLiftHint}
            </p>
          ) : (
            <LiftTrendChart squat={section.squat} bench={section.bench} deadlift={section.deadlift} />
          )}
        </Card>
      </motion.div>

      {/* PR timeline + DOTS over time */}
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <motion.div className="h-full" {...(shouldReduce ? {} : slideUp)}>
          <Card className="h-full">
            <div className="mb-4 flex items-center gap-2">
              <Award size={17} style={{ color: 'var(--color-primary)' }} />
              <h2 className="text-base font-semibold text-text">{tp.prTimeline}</h2>
            </div>
            {allPrs.length === 0 ? (
              <p className="text-sm text-muted">{tp.noPrs}</p>
            ) : (
              <PrTimeline events={allPrs} />
            )}
          </Card>
        </motion.div>

        <motion.div className="h-full" {...(shouldReduce ? {} : slideUp)}>
          <Card className="flex h-full flex-col">
            <div className="mb-4 flex items-center gap-2">
              <Activity size={17} style={{ color: 'var(--color-primary)' }} />
              <h2 className="text-base font-semibold text-text">{tp.dotsOverTime}</h2>
            </div>
            {section.dots.length === 0 ? (
              <p className="text-sm text-muted">
                {tp.dotsNeedsData}
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
  const tp = useT().progress
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
        <span className="text-xs font-medium text-muted">{translateLift(lift.lift, tp)}</span>
        {lift.isPlateau && (
          <span
            className="ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-medium"
            style={{ background: 'rgba(245,158,11,0.16)', color: 'var(--color-warning)' }}
          >
            {tp.plateau}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-text">
          {lift.currentE1Rm === null ? '—' : `${lift.currentE1Rm.toFixed(1)} ${tp.kgUnit}`}
        </p>
        <span className="text-xs text-muted">{tp.e1rm}</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        {tp.trainingMax}:{' '}
        <span className="font-semibold text-text">
          {lift.currentTrainingMax === null ? '—' : `${lift.currentTrainingMax.toFixed(1)} ${tp.kgUnit}`}
        </span>
      </p>
    </motion.div>
  )
}

interface PowerliftingAnalysis {
  estimatedTotal: string
  trainingMaxTotal: string
  benchSquatRatio: string
  deadliftSquatRatio: string
  prsLast30: string
  latestPr: string
  plateauLifts: string
  dotsBodyweight: string
  notes: Array<{ title: string; text: string }>
}

function buildPowerliftingAnalysis(section: PowerliftingSection, tp: Record<string, string>): PowerliftingAnalysis {
  const lifts = [section.squat, section.bench, section.deadlift]
  const estimatedTotal = sumPresent(lifts.map((lift) => lift.currentE1Rm))
  const trainingMaxTotal = sumPresent(lifts.map((lift) => lift.currentTrainingMax))
  const squat = section.squat.currentE1Rm
  const bench = section.bench.currentE1Rm
  const deadlift = section.deadlift.currentE1Rm
  const benchPct = ratioPercent(bench, squat)
  const deadliftPct = ratioPercent(deadlift, squat)
  const allPrs = lifts
    .flatMap((lift) => lift.prTimeline.map((pr) => ({ ...pr, lift: lift.lift })))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  const latestPr = allPrs[0]
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const prsLast30 = allPrs.filter((pr) => new Date(pr.date) >= thirtyDaysAgo).length
  const plateauLifts = lifts.filter((lift) => lift.isPlateau).map((lift) => translateLift(lift.lift, tp))
  const latestDots = section.dots.length > 0 ? section.dots[section.dots.length - 1] : null

  return {
    estimatedTotal: formatKg(estimatedTotal, tp),
    trainingMaxTotal: formatKg(trainingMaxTotal, tp),
    benchSquatRatio: benchPct == null ? '—' : `${benchPct}%`,
    deadliftSquatRatio: deadliftPct == null ? '—' : `${deadliftPct}%`,
    prsLast30: String(prsLast30),
    latestPr: latestPr ? `${translateLift(latestPr.lift, tp)} ${latestPr.e1Rm.toFixed(1)} ${tp.kgUnit}` : tp.noLatestPr,
    plateauLifts: plateauLifts.length > 0 ? plateauLifts.join(', ') : tp.noPlateau,
    dotsBodyweight: latestDots ? `${latestDots.bodyweightKg.toFixed(1)} ${tp.kgUnit}` : '—',
    notes: [
      {
        title: tp.analysisStrengthTitle,
        text: tp.analysisStrengthText
          .replace('{total}', formatKg(estimatedTotal, tp))
          .replace('{tm}', formatKg(trainingMaxTotal, tp)),
      },
      {
        title: tp.analysisRatioTitle,
        text: tp.analysisRatioText
          .replace('{benchPct}', benchPct == null ? '—' : String(benchPct))
          .replace('{deadliftPct}', deadliftPct == null ? '—' : String(deadliftPct)),
      },
      {
        title: tp.analysisMomentumTitle,
        text: latestDots
          ? tp.analysisDotsText
              .replace('{dots}', latestDots.dots.toFixed(1))
              .replace('{bodyweight}', latestDots.bodyweightKg.toFixed(1))
          : tp.analysisMomentumText
              .replace('{prs}', String(prsLast30))
              .replace('{latest}', latestPr ? `${translateLift(latestPr.lift, tp)} ${latestPr.e1Rm.toFixed(1)} ${tp.kgUnit}` : tp.noLatestPr),
      },
    ],
  }
}

function AnalysisMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3" style={{ background: 'var(--bg-2)', borderColor: 'var(--border-1)' }}>
      <div className="mb-2 flex items-center gap-2 text-muted">
        {icon}
        <p className="truncate text-xs font-medium">{label}</p>
      </div>
      <p className="truncate text-lg font-bold text-text">{value}</p>
    </div>
  )
}

function AlertIcon() {
  return <span className="text-sm font-bold">!</span>
}

function sumPresent(values: Array<number | null>): number {
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
}

function ratioPercent(value: number | null, baseline: number | null) {
  if (!value || !baseline) return null
  return Math.round((value / baseline) * 100)
}

function formatKg(value: number, tp: Record<string, string>) {
  return value > 0 ? `${value.toFixed(1)} ${tp.kgUnit}` : '—'
}

function translateLift(lift: LiftSeries['lift'], tp: Record<string, string>) {
  if (lift === 'Squat') return tp.squat
  if (lift === 'Bench') return tp.bench
  return tp.deadlift
}
