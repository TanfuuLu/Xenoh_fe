import { type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { format } from 'date-fns'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Footprints,
  Gauge,
  Layers3,
  Repeat2,
  Target,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { NotFoundPage } from '@/shared/components/NotFoundPage'
import { Spinner } from '@/shared/components/Spinner'
import { RequireTier } from '@/features/billing/components/RequireTier'
import { slideUp, staggerContainer } from '@/shared/utils/motion'
import { usePlan, usePlanDesignAnalysis } from '../index'
import type { PlanDesignAnalysisResponse } from '../types'

const CHART_TOOLTIP_STYLE = {
  background: 'var(--bg-2)',
  border: '1px solid var(--border-1)',
  borderRadius: 8,
  fontSize: 12,
}

const TICK_STYLE = { fill: 'var(--fg-3)', fontSize: 11 }

const MUSCLE_COLORS: Record<string, string> = {
  Chest: '#6366f1',
  Back: '#22c55e',
  Shoulders: '#f59e0b',
  Biceps: '#ec4899',
  Triceps: '#14b8a6',
  Forearms: '#8b5cf6',
  Quads: '#f97316',
  Quadriceps: '#f97316',
  Hamstrings: '#06b6d4',
  Glutes: '#e11d48',
  Calves: '#84cc16',
  Abs: '#a78bfa',
  Traps: '#0ea5e9',
  FullBody: '#94a3b8',
}

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string
  sub: string
}

function MetricCard({ icon, label, value, sub }: MetricCardProps) {
  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}
    >
      <div className="mb-2 flex items-center gap-2" style={{ color: 'var(--fg-3)' }}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--fg-1)' }}>{value}</p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--fg-3)' }}>{sub}</p>
    </div>
  )
}

function PlanDesignDashboard({
  analysis,
  loading,
  isError,
  onRetry,
}: {
  analysis?: PlanDesignAnalysisResponse
  loading: boolean
  isError: boolean
  onRetry: () => void
}) {
  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-muted">Auditing planned program structure...</p>
      </Card>
    )
  }

  if (isError || !analysis) {
    return (
      <Card className="space-y-3 py-8 text-center">
        <p className="font-semibold text-text">Could not load plan design analysis</p>
        <p className="text-sm text-muted">Try refreshing the planned-program audit.</p>
        <Button type="button" size="sm" onClick={onRetry}>
          <BarChart3 size={14} />
          Try again
        </Button>
      </Card>
    )
  }

  const hasPlannedWork = analysis.workload.plannedExercises > 0

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <SectionHeader icon={<CalendarDays size={17} />} title="Program Structure" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard icon={<CalendarDays size={18} />} label="Total weeks" value={String(analysis.structure.totalWeeks)} sub="planned block length" />
          <MetricCard icon={<Dumbbell size={18} />} label="Training days" value={String(analysis.structure.plannedTrainingDays)} sub="planned workout days" />
          <MetricCard icon={<CheckCircle2 size={18} />} label="Rest days" value={String(analysis.structure.plannedRestDays)} sub="explicit recovery days" />
          <MetricCard icon={<BarChart3 size={18} />} label="Days / week" value={analysis.structure.avgTrainingDaysPerWeek.toFixed(1)} sub="training density" />
          <MetricCard icon={<Repeat2 size={18} />} label="Longest streak" value={String(analysis.structure.longestTrainingStreak)} sub="consecutive training days" />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionHeader icon={<Dumbbell size={17} />} title="Planned Workload" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard icon={<Dumbbell size={18} />} label="Exercises" value={String(analysis.workload.plannedExercises)} sub="planned movements" />
          <MetricCard icon={<Layers3 size={18} />} label="Sets" value={String(analysis.workload.plannedSets)} sub="planned working sets" />
          <MetricCard icon={<Target size={18} />} label="Rep volume" value={formatNumber(analysis.workload.plannedRepVolume)} sub="sets multiplied by reps" />
          <MetricCard icon={<Gauge size={18} />} label="Tonnage" value={formatKg(analysis.workload.plannedTonnage)} sub="when planned weight exists" />
          <MetricCard icon={<Footprints size={18} />} label="Exercises / day" value={analysis.workload.avgExercisesPerTrainingDay.toFixed(1)} sub="average training day" />
        </div>
      </Card>

      {!hasPlannedWork ? (
        <Card>
          <SectionHeader icon={<Target size={17} />} title="No Planned Exercises Yet" />
          <p className="mt-2 text-sm text-muted">
            Add exercises to the plan to unlock muscle balance, movement coverage, recovery risk, and variety analysis.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <MuscleBalancePanel analysis={analysis} />
            <BodyBalancePanel analysis={analysis} />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <MovementCoveragePanel analysis={analysis} />
          </div>
          <ExerciseVarietyPanel analysis={analysis} />
        </>
      )}
    </div>
  )
}

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: 'var(--fg-2)' }}>
      {icon}
      <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
    </div>
  )
}

function MuscleBalancePanel({ analysis }: { analysis: PlanDesignAnalysisResponse }) {
  const rows = analysis.muscleGroups.slice(0, 10)

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SectionHeader icon={<Layers3 size={17} />} title="Muscle Balance" />
        <span className="text-xs text-muted">planned weighted sets</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No planned muscle data yet.</p>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 4, right: 8, left: 8, bottom: 34 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
                <XAxis
                  dataKey="muscleGroup"
                  tick={{ ...TICK_STYLE, angle: -35, textAnchor: 'end', dy: 8 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} width={34} />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelStyle={{ color: 'var(--fg-1)' }}
                  formatter={(value) => [Number(value).toFixed(1), 'Weighted sets']}
                />
                <Bar dataKey="weightedSets" radius={[4, 4, 0, 0]}>
                  {rows.map((entry) => (
                    <Cell key={entry.muscleGroup} fill={MUSCLE_COLORS[entry.muscleGroup] ?? '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {rows.map((item) => (
              <div key={item.muscleGroup} className="rounded-xl border px-3 py-2" style={{ background: 'var(--bg-3)', borderColor: 'var(--border-1)' }}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-text">{item.muscleGroup}</span>
                  <Badge variant={item.status === 'Dominant' ? 'warning' : item.status === 'Low' ? 'default' : 'success'}>
                    {item.percentOfTotal.toFixed(1)}%
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  <span>{item.weightedSets.toFixed(1)} weighted sets</span>
                  <span>Primary {item.primarySets.toFixed(1)}</span>
                  <span>Secondary {item.secondarySets.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

function BodyBalancePanel({ analysis }: { analysis: PlanDesignAnalysisResponse }) {
  const balance = analysis.balance
  const maxSets = Math.max(balance.maxSets, 1)
  const bars = [
    { label: 'Front', value: balance.frontSets, color: '#6366f1' },
    { label: 'Back', value: balance.backSets, color: '#22c55e' },
    { label: 'Upper', value: balance.upperSets, color: '#f97316' },
    { label: 'Lower', value: balance.lowerSets, color: '#06b6d4' },
    { label: 'Other', value: balance.otherSets, color: '#94a3b8' },
  ]

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SectionHeader icon={<Target size={17} />} title="Design Balance" />
        <span className="text-xs text-muted">planned emphasis</span>
      </div>
      <div className="space-y-3">
        {bars.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-text">{item.label}</span>
              <span className="text-muted">{item.value.toFixed(1)} sets</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full" style={{ background: 'var(--bg-3)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.max(3, (item.value / maxSets) * 100)}%`, background: item.color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3">
        <TagList title="Dominant groups" items={balance.dominantMuscleGroups} empty="No dominant outliers" tone="warning" />
        <TagList title="Undertrained groups" items={balance.undertrainedMajorMuscleGroups} empty="No major gaps detected" tone="muted" />
      </div>
    </Card>
  )
}

function MovementCoveragePanel({ analysis }: { analysis: PlanDesignAnalysisResponse }) {
  const rows = analysis.movementPatterns.map((pattern) => ({
    ...pattern,
    coveredLabel: pattern.isCovered ? 'Covered' : 'Missing',
  }))
  const maxSets = Math.max(...rows.map((row) => row.plannedSets), 1)

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SectionHeader icon={<CheckCircle2 size={17} />} title="Movement Pattern Coverage" />
        <span className="text-xs text-muted">
          {rows.filter((row) => row.isCovered).length}/{rows.length} covered
        </span>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, left: 104, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" horizontal={false} />
            <XAxis type="number" tick={TICK_STYLE} tickLine={false} axisLine={false} domain={[0, maxSets]} allowDecimals={false} />
            <YAxis type="category" dataKey="pattern" tick={TICK_STYLE} tickLine={false} axisLine={false} width={98} />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              labelStyle={{ color: 'var(--fg-1)' }}
              formatter={(value, name, item) => [
                name === 'plannedSets'
                  ? `${value} planned sets, ${(item.payload as { exerciseCount: number }).exerciseCount} exercises`
                  : value,
                'Coverage',
              ]}
            />
            <Bar dataKey="plannedSets" radius={[0, 6, 6, 0]} barSize={20}>
              {rows.map((entry) => (
                <Cell key={entry.pattern} fill={entry.isCovered ? '#22c55e' : '#a8a29e'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
        {rows.map((pattern) => (
          <div key={pattern.pattern} className="text-center">
            <div
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold"
              style={{
                background: pattern.isCovered ? 'rgba(34,197,94,0.12)' : 'var(--bg-3)',
                borderColor: pattern.isCovered ? 'rgba(34,197,94,0.35)' : 'var(--border-1)',
                color: pattern.isCovered ? 'var(--xn-success)' : 'var(--fg-4)',
              }}
              title={`${pattern.pattern}: ${pattern.coveredLabel}`}
            >
              {pattern.isCovered ? '✓' : '-'}
            </div>
            <p className="mt-1 truncate text-[10px] text-muted" title={pattern.pattern}>{pattern.pattern}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ExerciseVarietyPanel({ analysis }: { analysis: PlanDesignAnalysisResponse }) {
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SectionHeader icon={<Repeat2 size={17} />} title="Exercise Variety" />
        <span className="text-xs text-muted">
          {analysis.variety.uniqueExercises} unique exercises, {analysis.variety.repeatedExerciseCount} repeated
        </span>
      </div>
      {analysis.variety.topRepeatedExercises.length === 0 ? (
        <p className="text-sm text-muted">No repeated exercises detected in the planned program.</p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {analysis.variety.topRepeatedExercises.map((exercise) => (
            <div key={exercise.exerciseName} className="rounded-xl border px-4 py-3" style={{ background: 'var(--bg-2)', borderColor: 'var(--border-1)' }}>
              <p className="text-sm font-semibold text-text">{exercise.exerciseName}</p>
              <p className="mt-1 text-xs text-muted">{exercise.count} planned appearances</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function TagList({ title, items, empty, tone }: { title: string; items: string[]; empty: string; tone: 'warning' | 'muted' }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={tone === 'warning'
                ? { background: 'rgba(245,158,11,0.14)', color: 'var(--xn-warning)' }
                : { background: 'var(--bg-3)', color: 'var(--fg-3)' }}
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString()
}

function formatKg(value: number) {
  if (value <= 0) return '-'
  if (value >= 1000) return `${(value / 1000).toFixed(1)}t`
  return `${Math.round(value)}kg`
}

export function PlanOverviewPage() {
  const { planId = '' } = useParams()
  const navigate = useNavigate()
  const shouldReduce = useReducedMotion()

  const { data: plan, isLoading: planLoading, isError: planError } = usePlan(planId)
  const {
    data: designAnalysis,
    isLoading: designLoading,
    isError: designError,
    refetch: refetchDesignAnalysis,
  } = usePlanDesignAnalysis(planId)

  if (planLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (planError || !plan) return <NotFoundPage />

  return (
    <motion.div
      initial={shouldReduce ? false : 'hidden'}
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      <motion.div variants={slideUp} className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/plans')}>
            <ArrowLeft size={16} />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-bold" style={{ color: 'var(--fg-1)' }}>{plan.name}</h1>
              {plan.isActive && <Badge variant="success">Active</Badge>}
              {plan.planType === 'Coach' && <Badge variant="primary">Coach</Badge>}
            </div>
            <p className="text-sm" style={{ color: 'var(--fg-3)' }}>
              {format(new Date(plan.startDate), 'dd/MM/yyyy')} - {format(new Date(plan.endDate), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="secondary" size="sm" className="flex-shrink-0" onClick={() => navigate(`/plans/${planId}`)}>
            <span className="hidden sm:inline">View Workouts</span>
            <ChevronRight size={15} />
          </Button>
        </div>
      </motion.div>

      <motion.div variants={slideUp}>
        <RequireTier feature="Plan Analyze">
          <PlanDesignDashboard
            analysis={designAnalysis}
            loading={designLoading}
            isError={designError}
            onRetry={() => void refetchDesignAnalysis()}
          />
        </RequireTier>
      </motion.div>
    </motion.div>
  )
}
