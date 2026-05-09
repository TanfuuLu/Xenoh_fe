import { useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronRight, ChevronLeft, Pencil, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { useQueries } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { Spinner } from '@/shared/components/Spinner'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useAuthStore } from '@/features/auth'
import { useT } from '@/shared/i18n'
import { NotFoundPage } from '@/shared/components/NotFoundPage'
import { usePlan, usePlanBalanceCheck } from '../index'
import { useWeeklyWorkouts, useUpdateWeeklyWorkout } from '@/features/workouts'
import { InlineTip } from '@/features/tips'
import type { DailyWorkoutResponse, WeeklyWorkoutResponse } from '@/features/workouts'
import { CommentSection } from '@/features/comments/components/CommentSection'
import { usePlanComments, useAddPlanComment, useDeletePlanComment } from '@/features/comments/api/usePlanComments'

const schema = z.object({ name: z.string().min(1).max(100) })
type FormData = z.infer<typeof schema>

export function PlanDetailPage() {
  const { planId = '' } = useParams()
  const shouldReduce = useReducedMotion()
  const navigate = useNavigate()
  const isCoach = useAuthStore((s) => s.user?.roles?.includes('Coach') ?? false)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const { data: plan, isLoading: planLoading, isError: planError } = usePlan(planId)
  const { data: weeks, isLoading: weeksLoading } = useWeeklyWorkouts(planId)
  const { mutate: updateWeek } = useUpdateWeeklyWorkout(planId)
  const { data: comments = [], isLoading: commentsLoading } = usePlanComments(planId)
  const { mutateAsync: addComment, isPending: addingComment } = useAddPlanComment(planId)
  const { mutate: deleteComment, isPending: deletingComment } = useDeletePlanComment(planId)
  const { mutate: runBalanceCheck, data: balanceReview, isPending: checkingBalance, error: balanceError } = usePlanBalanceCheck(planId)
  const t   = useT()
  const tpd = t.planDetail
  const tc  = t.common

  // Coach can always edit; Individual can only edit their own Self plans
  const canEdit = isCoach || plan?.planType === 'Self'
  // Only the plan owner can mark sets as done
  const canComplete = !!currentUserId && plan?.ownerId === currentUserId

  const dayQueries = useQueries({
    queries: (weeks ?? []).map((week) => ({
      queryKey: ['days', week.id] as const,
      queryFn: () =>
        api.get<DailyWorkoutResponse[]>(ENDPOINTS.days.byWeek(week.id)).then((r) => r.data),
      enabled: !!week.id,
    })),
  })

  const planDays = dayQueries.flatMap((query) => query.data ?? [])

  const [editingWeek, setEditingWeek] = useState<WeeklyWorkoutResponse | null>(null)
  const weeksScrollerRef = useRef<HTMLDivElement>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  function handleEditWeek(week: WeeklyWorkoutResponse) {
    setEditingWeek(week)
    reset({ name: week.name })
  }

  function onRenameSubmit(data: FormData) {
    if (!editingWeek) return
    updateWeek({ weekId: editingWeek.id, data }, { onSuccess: () => setEditingWeek(null) })
  }

  function scrollWeeks(direction: -1 | 1) {
    weeksScrollerRef.current?.scrollBy({ left: direction * 360, behavior: 'smooth' })
  }

  if (planLoading || weeksLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (planError || !plan) return <NotFoundPage />

  const warningDays = planDays.filter((day) => day.hasWarning)
  const warningDaysByWeek = warningDays.reduce<Record<string, DailyWorkoutResponse[]>>((acc, day) => {
    acc[day.weeklyWorkoutId] ??= []
    acc[day.weeklyWorkoutId].push(day)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2">
        <Link to="/plans">
          <Button variant="ghost" size="sm"><ChevronLeft size={16} /></Button>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="min-w-0 break-words text-2xl font-bold text-text">{plan.name}</h1>
            {plan.isActive && <Badge variant="success">{tc.active}</Badge>}
          </div>
          <p className="text-sm text-muted">
            {format(new Date(plan.startDate), 'dd/MM/yyyy')} → {format(new Date(plan.endDate), 'dd/MM/yyyy')}
            &nbsp;·&nbsp;{plan.totalWeeks} {tc.weeks}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={() => runBalanceCheck()}
          loading={checkingBalance}
        >
          <Sparkles size={15} /> Balance check
        </Button>
      </div>

      <InlineTip placement="plan-detail" />

      {balanceReview && (
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles size={16} style={{ color: 'var(--xn-clay-700)' }} />
            <h2 className="font-semibold text-text">{balanceReview.headline}</h2>
            <Badge variant={balanceReview.severity === 'High' ? 'danger' : balanceReview.severity === 'Medium' ? 'warning' : 'success'}>
              {balanceReview.severity}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted">{balanceReview.summary}</p>
          {(balanceReview.warnings.length > 0 || balanceReview.suggestions.length > 0) && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {balanceReview.warnings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Warnings</p>
                  <ul className="mt-1 space-y-1 text-sm text-text">
                    {balanceReview.warnings.map((item, index) => <li key={index}>- {item}</li>)}
                  </ul>
                </div>
              )}
              {balanceReview.suggestions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Suggestions</p>
                  <ul className="mt-1 space-y-1 text-sm text-text">
                    {balanceReview.suggestions.map((item, index) => <li key={index}>- {item}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {balanceError && (
        <p className="text-sm text-danger">
          {((balanceError as { response?: { data?: { message?: string } } }).response?.data?.message) ?? 'Could not run balance check.'}
        </p>
      )}

      <div className="space-y-2">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            title="Scroll weeks left"
            onClick={() => scrollWeeks(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition hover:shadow-sm"
            style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)', color: 'var(--fg-2)' }}
          >
            <ChevronLeft size={17} />
          </button>
          <button
            type="button"
            title="Scroll weeks right"
            onClick={() => scrollWeeks(1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition hover:shadow-sm"
            style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)', color: 'var(--fg-2)' }}
          >
            <ChevronRight size={17} />
          </button>
        </div>

        <motion.div
          ref={weeksScrollerRef}
          initial={shouldReduce ? false : 'hidden'}
          animate="visible"
          variants={staggerContainer}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3"
          style={{ scrollbarGutter: 'stable' }}
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
                onClick={() => navigate(`/plans/${planId}/weeks/${week.id}`, { state: { canEdit, canComplete } })}
                className="min-w-[252px] snap-start rounded-xl border p-4 space-y-3 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md min-[390px]:min-w-[280px] sm:min-w-[320px] lg:min-w-[340px]"
                style={
                  hasWarning
                    ? { borderColor: 'var(--xn-warning)', background: 'var(--xn-warning-bg)' }
                    : weekDone
                    ? { borderColor: 'var(--xn-sage-400)', background: 'var(--xn-sage-200)' }
                    : { borderColor: 'var(--border-1)', background: 'var(--bg-2)' }
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--fg-3)' }}>
                      {tpd.weekLabel} {week.weekNumber}
                    </p>
                    <h3 className="break-words font-medium text-text">{week.name}</h3>
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
      </div>

      <CommentSection
        comments={comments}
        isLoading={commentsLoading}
        onAdd={(content) => addComment(content)}
        onDelete={(id) => deleteComment(id)}
        isPendingAdd={addingComment}
        isPendingDelete={deletingComment}
        className="mt-6"
      />

      <Modal open={!!editingWeek} onClose={() => setEditingWeek(null)} title={tpd.renameWeekTitle}>
        <form onSubmit={handleSubmit(onRenameSubmit)} className="space-y-4">
          <Input label={tpd.weekNameLabel} error={errors.name?.message} {...register('name')} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" type="button" className="w-full sm:w-auto" onClick={() => setEditingWeek(null)}>{tc.cancel}</Button>
            <Button type="submit" className="w-full sm:w-auto">{tpd.saveBtn}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
