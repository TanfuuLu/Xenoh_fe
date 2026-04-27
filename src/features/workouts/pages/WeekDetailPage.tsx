import { useParams, Link, useLocation, useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { vi as viLocale, enUS } from 'date-fns/locale'
import { useQueries } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Spinner } from '@/shared/components/Spinner'
import { cn } from '@/shared/utils/cn'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useT, useLangStore } from '@/shared/i18n'
import { useDailyWorkouts, useWeeklyWorkouts } from '../index'
import type { ExerciseResponse } from '../types'

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function hasExerciseWarning(exercises: ExerciseResponse[]): boolean {
  return exercises.some((ex) =>
    ex.sets.some(
      (s) =>
        s.isCompleted &&
        ((s.actualReps != null && s.actualReps < s.plannedReps) ||
          (s.actualWeight != null && s.plannedWeight != null && s.actualWeight < s.plannedWeight)),
    ),
  )
}

export function WeekDetailPage() {
  const { planId = '', weekId = '' } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const canEdit = (state as { canEdit?: boolean } | null)?.canEdit ?? true
  const shouldReduce = useReducedMotion()

  const { data: allWeeks } = useWeeklyWorkouts(planId)
  const { data: days, isLoading } = useDailyWorkouts(weekId)

  const t  = useT()
  const tw = t.weekDetail
  const tc = t.common
  const lang = useLangStore((s) => s.lang)
  const dateLocale = lang === 'vi' ? viLocale : enUS

  const currentWeekIndex = allWeeks?.findIndex((w) => w.id === weekId) ?? -1
  const currentWeek = allWeeks?.[currentWeekIndex]
  const prevWeek = currentWeekIndex > 0 ? allWeeks![currentWeekIndex - 1] : null
  const nextWeek =
    currentWeekIndex >= 0 && currentWeekIndex < (allWeeks?.length ?? 0) - 1
      ? allWeeks![currentWeekIndex + 1]
      : null

  const dayMap = new Map(days?.map((d) => [d.dayOfWeek, d]) ?? [])

  // Fetch exercises for each day that has exercises to detect warnings
  const daysWithExercises = days?.filter((d) => d.totalExercises > 0) ?? []
  const exerciseQueries = useQueries({
    queries: daysWithExercises.map((day) => ({
      queryKey: ['exercises', day.id],
      queryFn: () =>
        api.get<ExerciseResponse[]>(ENDPOINTS.exercises.byDay(day.id)).then((r) => r.data),
    })),
  })

  // Map dayId → has warning
  const warnedDayIds = new Set<string>()
  exerciseQueries.forEach((q, i) => {
    if (q.data && hasExerciseWarning(q.data)) {
      warnedDayIds.add(daysWithExercises[i].id)
    }
  })
  const weekHasWarning = warnedDayIds.size > 0

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link to={`/plans/${planId}`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft size={16} />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-text">
              {currentWeek ? `${tw.title} ${currentWeek.weekNumber}` : tw.title}
            </h1>
            {currentWeek && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>
                {format(new Date(currentWeek.startDate), 'd MMM', { locale: dateLocale })}
                {' — '}
                {format(new Date(currentWeek.endDate), 'd MMM yyyy', { locale: dateLocale })}
              </p>
            )}
          </div>
        </div>

        {allWeeks && allWeeks.length > 1 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              disabled={!prevWeek}
              onClick={() =>
                prevWeek &&
                navigate(`/plans/${planId}/weeks/${prevWeek.id}`, { state: { canEdit } })
              }
              className={cn(
                'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                prevWeek ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-30',
              )}
              style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
            >
              <ChevronLeft size={14} />
              {prevWeek ? `W${prevWeek.weekNumber}` : ''}
            </button>

            <span className="px-1 text-xs font-medium" style={{ color: 'var(--fg-3)' }}>
              {currentWeek ? `W${currentWeek.weekNumber}` : ''}
            </span>

            <button
              disabled={!nextWeek}
              onClick={() =>
                nextWeek &&
                navigate(`/plans/${planId}/weeks/${nextWeek.id}`, { state: { canEdit } })
              }
              className={cn(
                'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                nextWeek ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-30',
              )}
              style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
            >
              {nextWeek ? `W${nextWeek.weekNumber}` : ''}
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Weekly completion progress */}
      {currentWeek && currentWeek.totalDays > 0 && (() => {
        const pct      = Math.round((currentWeek.completedDays / currentWeek.totalDays) * 100)
        const weekDone = currentWeek.completedDays === currentWeek.totalDays
        return (
          <div
            className="rounded-xl px-4 py-3 space-y-2"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-text">{tw.weeklyCompletion}</span>
              <span className="font-bold" style={{ color: weekDone ? 'var(--xn-success)' : 'var(--color-primary)' }}>
                {pct}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--border-1)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full transition-colors"
                style={{ background: weekDone ? 'var(--xn-success)' : 'var(--color-primary)' }}
              />
            </div>
            <p className="text-xs text-muted">
              {currentWeek.completedDays} / {currentWeek.totalDays} {tc.days} · {tw.daysCompleted}
            </p>
          </div>
        )
      })()}

      {/* Week-level warning: any day has an exercise with actual < planned */}
      {weekHasWarning && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <AlertTriangle size={15} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-warning)' }}>
            {warnedDayIds.size === 1
              ? '1 day this week has exercises below planned — review your performance.'
              : `${warnedDayIds.size} days this week have exercises below planned — review your performance.`}
          </p>
        </div>
      )}

      {/* Calendar grid */}
      <motion.div
        initial={shouldReduce ? false : 'hidden'}
        animate="visible"
        variants={staggerContainer}
        className="overflow-hidden rounded-2xl border"
        style={{ borderColor: 'var(--border-1)', background: 'var(--border-1)' }}
      >
        {/* Day-of-week header row */}
        <div className="grid grid-cols-7 gap-px">
          {DAY_SHORT.map((d) => (
            <div
              key={d}
              className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-widest"
              style={{ background: 'var(--bg-2)', color: 'var(--fg-3)' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px">
          {DAY_ORDER.map((dayName) => {
            const day = dayMap.get(dayName)

            if (!day) {
              return (
                <div
                  key={dayName}
                  className="min-h-36 p-3"
                  style={{ background: 'var(--bg-1)', opacity: 0.4 }}
                />
              )
            }

            const isToday =
              format(new Date(day.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
            const dayWarned = warnedDayIds.has(day.id)

            return (
              <motion.div
                key={day.id}
                variants={slideUp}
                className="relative min-h-36"
                style={day.isCompleted ? { background: 'var(--xn-sage-200)' } : { background: 'var(--bg-2)' }}
              >
                <Link
                  to={`/days/${day.id}`}
                  state={{ canEdit, weeklyWorkoutId: day.weeklyWorkoutId }}
                  className="flex flex-col h-full min-h-36 p-3 transition-opacity hover:opacity-80"
                >
                  {/* Date number */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span
                        className={cn(
                          'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold',
                          isToday ? 'text-white' : day.isCompleted ? 'text-success' : 'text-text',
                        )}
                        style={isToday ? { background: 'var(--color-primary)' } : undefined}
                      >
                        {format(new Date(day.date), 'd')}
                      </span>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>
                        {format(new Date(day.date), 'MMM', { locale: dateLocale })}
                      </p>
                    </div>

                    {dayWarned ? (
                      <AlertTriangle size={15} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                    ) : day.isCompleted ? (
                      <CheckCircle2 size={15} style={{ color: 'var(--xn-success)', flexShrink: 0 }} />
                    ) : day.totalExercises > 0 ? (
                      <Badge variant="warning">
                        {day.completedExercises}/{day.totalExercises}
                      </Badge>
                    ) : null}
                  </div>

                  {/* Exercise count */}
                  {day.totalExercises > 0 ? (
                    <p className="text-xs" style={{ color: 'var(--fg-3)' }}>
                      {day.totalExercises} {tc.exercises}
                    </p>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--fg-3)', opacity: 0.5 }}>
                      Rest
                    </p>
                  )}

                  {!day.isCompleted && day.totalExercises > 0 && (
                    <div
                      className="mt-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium"
                      style={{ background: 'var(--xn-clay-200)', color: 'var(--xn-clay-800)' }}
                    >
                      {tw.startSession}
                      <ChevronRight size={11} className="ml-auto" />
                    </div>
                  )}

                  {day.isCompleted && !dayWarned && (
                    <div
                      className="mt-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium"
                      style={{ background: 'rgba(139,150,101,0.15)', color: 'var(--xn-success)' }}
                    >
                      <CheckCircle2 size={11} />
                      {tw.completed}
                    </div>
                  )}

                  {day.isCompleted && dayWarned && (
                    <div
                      className="mt-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium"
                      style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--color-warning)' }}
                    >
                      <AlertTriangle size={11} />
                      Below planned
                    </div>
                  )}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
