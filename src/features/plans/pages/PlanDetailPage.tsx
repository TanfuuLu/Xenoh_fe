import { useState } from 'react'
import type { ReactNode } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronRight, ChevronLeft, Pencil, CheckCircle2, CalendarDays, Dumbbell, Percent, Layers3, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { useQueries } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useAuthStore } from '@/features/auth'
import { useT } from '@/shared/i18n'
import { MuscleGroup as MuscleGroupValues } from '@/shared/types/api'
import { usePlan } from '../index'
import { useWeeklyWorkouts, useUpdateWeeklyWorkout } from '@/features/workouts'
import type { DailyWorkoutResponse, ExerciseResponse, WeeklyWorkoutResponse } from '@/features/workouts'
import type { MuscleGroup } from '@/shared/types/api'
import { CommentSection } from '@/features/comments/components/CommentSection'
import { usePlanComments, useAddPlanComment, useDeletePlanComment } from '@/features/comments/api/usePlanComments'

const schema = z.object({ name: z.string().min(1).max(100) })
type FormData = z.infer<typeof schema>
const ALL_MUSCLE_GROUPS = Object.values(MuscleGroupValues)

interface PlanMetricProps {
  icon: ReactNode
  label: string
  value: string
  sub: string
}

function PlanMetric({ icon, label, value, sub }: PlanMetricProps) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-text">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
    </div>
  )
}

interface MuscleGroupStat {
  muscleGroup: MuscleGroup
  count: number
  percent: number
  status: 'High focus' | 'Balanced' | 'Low focus' | 'Not planned'
}

interface MuscleGroupAnalysisProps {
  stats: MuscleGroupStat[]
}

function MuscleGroupAnalysis({ stats }: MuscleGroupAnalysisProps) {
  const plannedStats = stats.filter((stat) => stat.percent > 0)

  return (
    <div className="flex flex-wrap gap-2">
      {plannedStats.map((stat) => {
        return (
          <div
            key={stat.muscleGroup}
            className="rounded-full px-4 py-2 text-sm font-semibold"
            style={{ background: 'var(--xn-clay-200)', color: 'var(--xn-clay-800)' }}
          >
            {stat.muscleGroup} {stat.percent}%
          </div>
        )
      })}
    </div>
  )
}

export function PlanDetailPage() {
  const { planId = '' } = useParams()
  const shouldReduce = useReducedMotion()
  const navigate = useNavigate()
  const isCoach = useAuthStore((s) => s.user?.roles?.includes('Coach') ?? false)
  const { data: plan, isLoading: planLoading } = usePlan(planId)
  const { data: weeks, isLoading: weeksLoading } = useWeeklyWorkouts(planId)
  const { mutate: updateWeek } = useUpdateWeeklyWorkout(planId)
  const { data: comments = [], isLoading: commentsLoading } = usePlanComments(planId)
  const { mutateAsync: addComment, isPending: addingComment } = useAddPlanComment(planId)
  const { mutate: deleteComment, isPending: deletingComment } = useDeletePlanComment(planId)
  const t   = useT()
  const tpd = t.planDetail
  const tc  = t.common

  // Coach can always edit; Individual can only edit their own Self plans
  const canEdit = isCoach || plan?.planType === 'Self'

  const dayQueries = useQueries({
    queries: (weeks ?? []).map((week) => ({
      queryKey: ['days', week.id] as const,
      queryFn: () =>
        api.get<DailyWorkoutResponse[]>(ENDPOINTS.days.byWeek(week.id)).then((r) => r.data),
      enabled: !!week.id,
    })),
  })

  const planDays = dayQueries.flatMap((query) => query.data ?? [])
  const exerciseQueries = useQueries({
    queries: planDays
      .filter((day) => day.totalExercises > 0)
      .map((day) => ({
        queryKey: ['exercises', day.id] as const,
        queryFn: () =>
          api.get<ExerciseResponse[]>(ENDPOINTS.exercises.byDay(day.id)).then((r) => r.data),
        enabled: !!day.id,
      })),
  })

  const plannedMuscleMentions = exerciseQueries
    .flatMap((query) => query.data ?? [])
    .flatMap((exercise) => [exercise.primaryMuscleGroup, ...exercise.secondaryMuscleGroups])
  const plannedMuscleGroups = Array.from(new Set(plannedMuscleMentions)).sort()
  const totalMuscleMentions = plannedMuscleMentions.length
  const averagePlannedShare = plannedMuscleGroups.length > 0 ? 100 / plannedMuscleGroups.length : 0
  const muscleGroupStats = ALL_MUSCLE_GROUPS.map((muscleGroup) => {
    const count = plannedMuscleMentions.filter((planned) => planned === muscleGroup).length
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
  }).sort((a, b) => b.percent - a.percent || a.muscleGroup.localeCompare(b.muscleGroup))

  const [editingWeek, setEditingWeek] = useState<WeeklyWorkoutResponse | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  function handleEditWeek(week: WeeklyWorkoutResponse) {
    setEditingWeek(week)
    reset({ name: week.name })
  }

  function onRenameSubmit(data: FormData) {
    if (!editingWeek) return
    updateWeek({ weekId: editingWeek.id, data }, { onSuccess: () => setEditingWeek(null) })
  }

  if (planLoading || weeksLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!plan) return <p className="text-muted">{tpd.notFound}</p>

  const totalWeeks = plan.totalWeeks || weeks?.length || 0
  const weeksDone = weeks?.filter((week) => week.totalDays > 0 && week.completedDays === week.totalDays).length ?? 0
  const completionPct = plan.totalDays > 0 ? Math.round((plan.completedDays / plan.totalDays) * 100) : 0
  const warningDays = planDays.filter((day) => day.hasWarning)
  const warningDaysByWeek = warningDays.reduce<Record<string, DailyWorkoutResponse[]>>((acc, day) => {
    acc[day.weeklyWorkoutId] ??= []
    acc[day.weeklyWorkoutId].push(day)
    return acc
  }, {})
  const muscleGroupsLoading =
    dayQueries.some((query) => query.isLoading) || exerciseQueries.some((query) => query.isLoading)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/plans">
          <Button variant="ghost" size="sm"><ChevronLeft size={16} /></Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-text">{plan.name}</h1>
            {plan.isActive && <Badge variant="success">{tc.active}</Badge>}
          </div>
          <p className="text-sm text-muted">
            {format(new Date(plan.startDate), 'dd/MM/yyyy')} → {format(new Date(plan.endDate), 'dd/MM/yyyy')}
            &nbsp;·&nbsp;{plan.totalWeeks} {tc.weeks}
          </p>
        </div>
      </div>

      <Card className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Workout plan detail</p>
          <h2 className="mt-1 text-lg font-semibold text-text">{plan.name}</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PlanMetric
            icon={<CalendarDays size={18} />}
            label="Weeks in plan"
            value={totalWeeks.toString()}
            sub={`${plan.totalDays} ${tc.days}`}
          />
          <PlanMetric
            icon={<CheckCircle2 size={18} />}
            label="Weeks done"
            value={weeksDone.toString()}
            sub={`${weeksDone}/${totalWeeks} ${tc.weeks}`}
          />
          <PlanMetric
            icon={<Percent size={18} />}
            label="Completion"
            value={`${completionPct}%`}
            sub={`${plan.completedDays}/${plan.totalDays} ${tc.days}`}
          />
          <PlanMetric
            icon={<Dumbbell size={18} />}
            label="Muscle groups"
            value={muscleGroupsLoading ? '...' : plannedMuscleGroups.length.toString()}
            sub="planned in this plan"
          />
        </div>

        {warningDays.length > 0 && (
          <div
            className="rounded-xl border px-4 py-3"
            style={{ borderColor: 'var(--xn-warning)', background: 'var(--xn-warning-bg)' }}
          >
            <div className="mb-2 flex items-center gap-2" style={{ color: 'var(--xn-warning)' }}>
              <AlertTriangle size={16} />
              <p className="text-sm font-semibold text-text">
                {warningDays.length === 1
                  ? '1 day has exercise performance below target'
                  : `${warningDays.length} days have exercise performance below target`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {warningDays.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => navigate(`/days/${day.id}`, { state: { canEdit, weeklyWorkoutId: day.weeklyWorkoutId } })}
                  className="rounded-full border px-3 py-1 text-xs font-semibold transition hover:shadow-sm"
                  style={{
                    borderColor: 'var(--xn-warning)',
                    background: 'var(--bg-2)',
                    color: 'var(--xn-warning)',
                  }}
                >
                  {format(new Date(day.date), 'dd/MM')} - {day.dayOfWeek}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>Plan completion</span>
            <span>{completionPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--border-1)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: completionPct === 100 ? 'var(--xn-success)' : 'var(--color-primary)' }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <Layers3 size={14} />
            Planned muscle groups
          </div>
          {muscleGroupsLoading ? (
            <p className="text-sm text-muted">Loading muscle groups...</p>
          ) : plannedMuscleGroups.length > 0 ? (
            <MuscleGroupAnalysis stats={muscleGroupStats} />
          ) : (
            <p className="text-sm text-muted">No exercises planned yet.</p>
          )}
        </div>
      </Card>

      <motion.div
        initial={shouldReduce ? false : 'hidden'}
        animate="visible"
        variants={staggerContainer}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence>
          {weeks?.map((week) => {
            const pct      = week.totalDays > 0 ? Math.round((week.completedDays / week.totalDays) * 100) : 0
            const weekDone = week.totalDays > 0 && week.completedDays === week.totalDays
            const warningDaysInWeek = warningDaysByWeek[week.id]?.length ?? 0
            const hasWarning = week.hasWarning || warningDaysInWeek > 0
            return (
              <motion.div
                key={week.id}
                variants={slideUp}
                layout
                onClick={() => navigate(`/plans/${planId}/weeks/${week.id}`, { state: { canEdit } })}
                className="rounded-xl border p-4 space-y-3 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                style={
                  hasWarning
                    ? { borderColor: 'var(--xn-warning)', background: 'var(--xn-warning-bg)' }
                    : weekDone
                    ? { borderColor: 'var(--xn-sage-400)', background: 'var(--xn-sage-200)' }
                    : { borderColor: 'var(--border-1)', background: 'var(--bg-2)' }
                }
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--fg-3)' }}>
                      {tpd.weekLabel} {week.weekNumber}
                    </p>
                    <h3 className="font-medium text-text">{week.name}</h3>
                    <p className="text-xs text-muted">
                      {format(new Date(week.startDate), 'dd/MM')} – {format(new Date(week.endDate), 'dd/MM')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasWarning && <AlertTriangle size={18} style={{ color: 'var(--xn-warning)' }} />}
                    {weekDone && <CheckCircle2 size={18} style={{ color: 'var(--xn-success)' }} />}
                    {canEdit && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditWeek(week) }}
                        className="rounded p-1 text-muted hover:text-text transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>{week.completedDays}/{week.totalDays} {tc.days}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--border-1)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: weekDone ? 'var(--xn-success)' : 'var(--color-primary)',
                      }}
                    />
                  </div>
                </div>

                <div
                  className="inline-flex items-center gap-1 text-sm transition-colors"
                  style={{ color: hasWarning ? 'var(--xn-warning)' : weekDone ? 'var(--xn-success)' : 'var(--color-primary)' }}
                >
                  {hasWarning ? (
                    <><AlertTriangle size={14} /> {warningDaysInWeek || 'Some'} day{warningDaysInWeek === 1 ? '' : 's'} below target</>
                  ) : weekDone ? (
                    <><CheckCircle2 size={14} /> {tpd.weekCompleted}</>
                  ) : (
                    <>{tpd.viewDays} <ChevronRight size={14} /></>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      <CommentSection
        comments={comments}
        isLoading={commentsLoading}
        onAdd={(content) => addComment(content)}
        onDelete={(id) => deleteComment(id)}
        isPendingAdd={addingComment}
        isPendingDelete={deletingComment}
      />

      <Modal open={!!editingWeek} onClose={() => setEditingWeek(null)} title={tpd.renameWeekTitle}>
        <form onSubmit={handleSubmit(onRenameSubmit)} className="space-y-4">
          <Input label={tpd.weekNameLabel} error={errors.name?.message} {...register('name')} />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setEditingWeek(null)}>{tc.cancel}</Button>
            <Button type="submit">{tpd.saveBtn}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
