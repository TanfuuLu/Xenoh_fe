import { useState, type ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Percent,
  Dumbbell,
  Layers3,
  ChevronRight,
  Timer,
  Activity,
  Sparkles,
} from 'lucide-react'
import { format } from 'date-fns'
import { useQueries } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { MuscleGroup as MuscleGroupValues } from '@/shared/types/api'
import { NotFoundPage } from '@/shared/components/NotFoundPage'
import { RequireTier } from '@/features/billing/components/RequireTier'
import { usePlan, usePlanBalanceCheck } from '../index'
import { useWeeklyWorkouts } from '@/features/workouts'
import type { DailyWorkoutResponse, ExerciseResponse } from '@/features/workouts'
import type { MuscleGroup } from '@/shared/types/api'
import type { PlanBalanceReviewResponse } from '../types'

const ALL_MUSCLE_GROUPS = Object.values(MuscleGroupValues)

function calcTotalDuration(exercises: ExerciseResponse[]): number {
  return exercises.reduce((total, ex) => total + (ex.durationSeconds ?? 0), 0)
}

function calcAverageRpe(exercises: ExerciseResponse[]): number | null {
  const values = exercises.flatMap((ex) => ex.sets).filter((s) => s.isCompleted && s.rpe != null).map((s) => s.rpe as number)
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string
  sub: string
}

function MetricCard({ icon, label, value, sub }: MetricCardProps) {
  return (
    <div className="rounded-xl border px-4 py-3" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
      <div className="mb-2 flex items-center gap-2" style={{ color: 'var(--fg-3)' }}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--fg-1)' }}>{value}</p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--fg-3)' }}>{sub}</p>
    </div>
  )
}

function PlanBalanceInsights({
  review,
  loading,
  errorMessage,
  onRetry,
}: {
  review?: PlanBalanceReviewResponse
  loading: boolean
  errorMessage: string | null
  onRetry: () => void
}) {
  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-muted">AI is checking plan mistakes and improvement suggestions...</p>
      </Card>
    )
  }

  if (errorMessage) {
    return (
      <Card className="space-y-3 py-8 text-center">
        <p className="font-semibold text-text">Could not review this plan</p>
        <p className="text-sm text-muted">{errorMessage}</p>
        <Button type="button" size="sm" onClick={onRetry}>
          <Sparkles size={14} />
          Try again
        </Button>
      </Card>
    )
  }

  if (!review) return null

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles size={18} style={{ color: 'var(--accent)' }} />
        <h2 className="text-base font-semibold text-text">{review.headline}</h2>
        <Badge variant={review.severity === 'High' ? 'danger' : review.severity === 'Medium' ? 'warning' : 'success'}>
          {review.severity}
        </Badge>
      </div>
      <p className="text-sm leading-relaxed text-muted">{review.summary}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <PlanAdviceList
          icon={<AlertTriangle size={16} />}
          title="Mistakes to fix"
          items={review.warnings}
          tone="warning"
        />
        <PlanAdviceList
          icon={<CheckCircle2 size={16} />}
          title="Suggestions"
          items={review.suggestions}
          tone="success"
        />
      </div>
    </Card>
  )
}

function PlanAdviceList({
  icon,
  title,
  items,
  tone,
}: {
  icon: ReactNode
  title: string
  items: string[]
  tone: 'warning' | 'success'
}) {
  const color = tone === 'warning' ? 'var(--xn-warning)' : 'var(--xn-success)'

  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-2)', borderColor: 'var(--border-1)' }}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        <span style={{ color }}>{icon}</span>
        {title}
      </div>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-text">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: color }} />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">No clear issue found from the current plan data.</p>
      )}
    </div>
  )
}

interface MuscleGroupStat {
  muscleGroup: MuscleGroup
  count: number
  percent: number
  status: 'High focus' | 'Balanced' | 'Low focus' | 'Not planned'
}

export function PlanOverviewPage() {
  const { planId = '' } = useParams()
  const navigate = useNavigate()
  const shouldReduce = useReducedMotion()
  const [showAiInsights, setShowAiInsights] = useState(false)

  const { data: plan, isLoading: planLoading, isError: planError } = usePlan(planId)
  const { data: weeks = [], isLoading: weeksLoading } = useWeeklyWorkouts(planId)
  const {
    mutate: runBalanceCheck,
    data: balanceReview,
    isPending: checkingBalance,
    error: balanceError,
  } = usePlanBalanceCheck(planId)

  function toggleAiInsights() {
    setShowAiInsights((open) => {
      const nextOpen = !open
      if (nextOpen && !balanceReview && !checkingBalance) runBalanceCheck()
      return nextOpen
    })
  }

  const dayQueries = useQueries({
    queries: weeks.map((week) => ({
      queryKey: ['days', week.id] as const,
      queryFn: () =>
        api.get<DailyWorkoutResponse[]>(ENDPOINTS.days.byWeek(week.id)).then((r) => r.data),
      enabled: !!week.id,
    })),
  })

  const allDays = dayQueries.flatMap((q) => q.data ?? [])

  const exerciseQueries = useQueries({
    queries: allDays
      .filter((day) => day.totalExercises > 0)
      .map((day) => ({
        queryKey: ['exercises', day.id] as const,
        queryFn: () =>
          api.get<ExerciseResponse[]>(ENDPOINTS.exercises.byDay(day.id)).then((r) => r.data),
        enabled: !!day.id,
      })),
  })

  const allExercises = exerciseQueries.flatMap((q) => q.data ?? [])
  const plannedMuscleMentions = allExercises.flatMap((ex) => [
    ex.primaryMuscleGroup,
    ...ex.secondaryMuscleGroups,
  ])
  const plannedMuscleGroups = Array.from(new Set(plannedMuscleMentions)).sort()
  const totalMuscleMentions = plannedMuscleMentions.length
  const averagePlannedShare = plannedMuscleGroups.length > 0 ? 100 / plannedMuscleGroups.length : 0

  const muscleGroupStats: MuscleGroupStat[] = ALL_MUSCLE_GROUPS.map((muscleGroup) => {
    const count = plannedMuscleMentions.filter((m) => m === muscleGroup).length
    const percent = totalMuscleMentions > 0 ? Math.round((count / totalMuscleMentions) * 100) : 0
    const status: MuscleGroupStat['status'] =
      count === 0
        ? 'Not planned'
        : percent >= averagePlannedShare * 1.35
          ? 'High focus'
          : percent <= averagePlannedShare * 0.65
            ? 'Low focus'
            : 'Balanced'
    return { muscleGroup, count, percent, status }
  })
    .filter((s) => s.percent > 0)
    .sort((a, b) => b.percent - a.percent || a.muscleGroup.localeCompare(b.muscleGroup))

  const muscleGroupsLoading =
    dayQueries.some((q) => q.isLoading) || exerciseQueries.some((q) => q.isLoading)

  const totalDurationSeconds = calcTotalDuration(allExercises)
  const averageRpe = calcAverageRpe(allExercises)

  if (planLoading || weeksLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (planError || !plan) return <NotFoundPage />

  const totalWeeks = plan.totalWeeks || weeks.length || 0
  const weeksDone = weeks.filter((w) => w.totalDays > 0 && w.completedDays === w.totalDays).length
  const completionPct = plan.totalDays > 0 ? Math.round((plan.completedDays / plan.totalDays) * 100) : 0

  return (
    <motion.div
      initial={shouldReduce ? false : 'hidden'}
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      {/* Header row */}
      <motion.div variants={slideUp} className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/plans')}>
            <ArrowLeft size={16} />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-bold" style={{ color: 'var(--fg-1)' }}>
                {plan.name}
              </h1>
              {plan.isActive && <Badge variant="success">Active</Badge>}
              {plan.planType === 'Coach' && <Badge variant="primary">Coach</Badge>}
            </div>
            <p className="text-sm" style={{ color: 'var(--fg-3)' }}>
              {format(new Date(plan.startDate), 'dd/MM/yyyy')} → {format(new Date(plan.endDate), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant={showAiInsights ? 'primary' : 'secondary'}
            size="sm"
            className="flex-shrink-0"
            onClick={toggleAiInsights}
          >
            <Sparkles size={15} />
            <span className="hidden sm:inline">AI Insights</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-shrink-0"
            onClick={() => navigate(`/plans/${planId}`)}
          >
            <span className="hidden sm:inline">View Workouts</span>
            <ChevronRight size={15} />
          </Button>
        </div>
      </motion.div>

      {showAiInsights && (
        <motion.div variants={slideUp}>
          <RequireTier feature="AI Insights">
            <PlanBalanceInsights
              review={balanceReview}
              loading={checkingBalance}
              errorMessage={((balanceError as { response?: { data?: { message?: string } } } | null)?.response?.data?.message) ?? null}
              onRetry={() => runBalanceCheck()}
            />
          </RequireTier>
        </motion.div>
      )}

      {/* Metrics */}
      <motion.div variants={slideUp} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          icon={<CalendarDays size={18} />}
          label="Total weeks"
          value={totalWeeks.toString()}
          sub={`${plan.totalDays} days`}
        />
        <MetricCard
          icon={<CheckCircle2 size={18} />}
          label="Weeks done"
          value={weeksDone.toString()}
          sub={`${weeksDone}/${totalWeeks} weeks`}
        />
        <MetricCard
          icon={<Percent size={18} />}
          label="Completion"
          value={`${completionPct}%`}
          sub={`${plan.completedDays}/${plan.totalDays} days`}
        />
        <MetricCard
          icon={<Dumbbell size={18} />}
          label="Muscle groups"
          value={muscleGroupsLoading ? '…' : plannedMuscleGroups.length.toString()}
          sub="planned in this plan"
        />
        <MetricCard
          icon={<Timer size={18} />}
          label="Total time"
          value={muscleGroupsLoading ? '…' : totalDurationSeconds > 0 ? formatDuration(totalDurationSeconds) : '—'}
          sub="across all workouts"
        />
        <MetricCard
          icon={<Activity size={18} />}
          label="Avg RPE"
          value={muscleGroupsLoading ? '…' : averageRpe != null ? averageRpe.toFixed(1) : '—'}
          sub="average effort"
        />
      </motion.div>

      {/* Progress bar */}
      <motion.div variants={slideUp}>
        <Card className="space-y-3">
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--fg-3)' }}>
            <span>Plan completion</span>
            <span className="font-semibold" style={{ color: completionPct === 100 ? 'var(--xn-success)' : 'var(--color-primary)' }}>
              {completionPct}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full" style={{ background: 'var(--border-1)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: completionPct === 100 ? 'var(--xn-success)' : 'var(--color-primary)' }}
            />
          </div>
          <div className="flex justify-between text-xs" style={{ color: 'var(--fg-3)' }}>
            <span>{plan.completedDays} days done</span>
            <span>{plan.totalDays - plan.completedDays} days remaining</span>
          </div>
        </Card>
      </motion.div>

      {/* Muscle groups breakdown */}
      <motion.div variants={slideUp}>
        <Card className="space-y-4">
          <div className="flex items-center gap-2" style={{ color: 'var(--fg-2)' }}>
            <Layers3 size={16} />
            <h2 className="text-sm font-semibold uppercase tracking-wide">Planned muscle groups</h2>
          </div>

          {muscleGroupsLoading ? (
            <p className="text-sm" style={{ color: 'var(--fg-3)' }}>Loading muscle groups…</p>
          ) : muscleGroupStats.length > 0 ? (
            <div className="space-y-4">
              {/* Badge cloud */}
              <div className="flex flex-wrap gap-2">
                {muscleGroupStats.map((stat) => (
                  <div
                    key={stat.muscleGroup}
                    className="rounded-full px-4 py-2 text-sm font-semibold"
                    style={
                      stat.status === 'High focus'
                        ? { background: 'rgba(99,102,241,0.15)', color: 'var(--color-primary)' }
                        : stat.status === 'Low focus'
                          ? { background: 'var(--bg-3)', color: 'var(--fg-3)' }
                          : { background: 'var(--xn-clay-200)', color: 'var(--xn-clay-800)' }
                    }
                  >
                    {stat.muscleGroup} {stat.percent}%
                  </div>
                ))}
              </div>

              {/* Bar breakdown */}
              <div className="space-y-2">
                {muscleGroupStats.map((stat) => (
                  <div key={stat.muscleGroup} className="flex items-center gap-3">
                    <span className="w-28 flex-shrink-0 text-xs" style={{ color: 'var(--fg-2)' }}>
                      {stat.muscleGroup}
                    </span>
                    <div className="flex-1 overflow-hidden rounded-full h-2" style={{ background: 'var(--border-1)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.percent}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                        className="h-full rounded-full"
                        style={{
                          background:
                            stat.status === 'High focus'
                              ? 'var(--color-primary)'
                              : stat.status === 'Low focus'
                                ? 'var(--fg-4)'
                                : 'var(--xn-clay-500)',
                        }}
                      />
                    </div>
                    <span className="w-8 flex-shrink-0 text-right text-xs font-medium" style={{ color: 'var(--fg-3)' }}>
                      {stat.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--fg-3)' }}>No exercises planned yet.</p>
          )}
        </Card>
      </motion.div>
    </motion.div>
  )
}
