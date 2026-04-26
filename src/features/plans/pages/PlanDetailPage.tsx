import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronRight, ChevronLeft, Pencil, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { Spinner } from '@/shared/components/Spinner'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useAuthStore } from '@/features/auth'
import { useT } from '@/shared/i18n'
import { usePlan } from '../index'
import { useWeeklyWorkouts, useUpdateWeeklyWorkout } from '@/features/workouts'
import type { WeeklyWorkoutResponse } from '@/features/workouts'

const schema = z.object({ name: z.string().min(1).max(100) })
type FormData = z.infer<typeof schema>

export function PlanDetailPage() {
  const { planId = '' } = useParams()
  const shouldReduce = useReducedMotion()
  const navigate = useNavigate()
  const isCoach = useAuthStore((s) => s.user?.roles?.includes('Coach') ?? false)
  const { data: plan, isLoading: planLoading } = usePlan(planId)
  const { data: weeks, isLoading: weeksLoading } = useWeeklyWorkouts(planId)
  const { mutate: updateWeek } = useUpdateWeeklyWorkout(planId)
  const t   = useT()
  const tpd = t.planDetail
  const tc  = t.common

  // Coach can always edit; Individual can only edit their own Self plans
  const canEdit = isCoach || plan?.planType === 'Self'

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
            return (
              <motion.div
                key={week.id}
                variants={slideUp}
                layout
                onClick={() => navigate(`/plans/${planId}/weeks/${week.id}`, { state: { canEdit } })}
                className="rounded-xl border p-4 space-y-3 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                style={
                  weekDone
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
                  style={{ color: weekDone ? 'var(--xn-success)' : 'var(--color-primary)' }}
                >
                  {weekDone ? (
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
