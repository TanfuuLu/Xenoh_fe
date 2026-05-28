import { useParams, Link, useLocation, useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, BarChart2, BedDouble, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { vi as viLocale, enUS } from 'date-fns/locale'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Spinner } from '@/shared/components/Spinner'
import { cn } from '@/shared/utils/cn'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useT, useLangStore } from '@/shared/i18n'
import { NotFoundPage } from '@/shared/components/NotFoundPage'
import { useDailyWorkouts, useWeeklyWorkouts } from '../index'
import { InlineTip } from '@/features/tips'
import { CommentSection } from '@/features/comments/components/CommentSection'
import { useWeekComments, useAddWeekComment, useDeleteWeekComment } from '@/features/comments/api/useWeekComments'

export function WeekDetailPage() {
  const { planId = '', weekId = '' } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const locationState = state as { canEdit?: boolean; canComplete?: boolean } | null
  const canEdit = locationState?.canEdit ?? false
  const canComplete = locationState?.canComplete ?? false
  const shouldReduce = useReducedMotion()

  const {
    data: allWeeks,
    isError: weeksError,
    hasNextPage: hasMoreWeeks,
    fetchNextPage: fetchMoreWeeks,
    isFetchingNextPage: loadingMoreWeeks,
  } = useWeeklyWorkouts(planId)
  const {
    data: days,
    isLoading,
    isError: daysError,
    hasNextPage: hasMoreDays,
    fetchNextPage: fetchMoreDays,
    isFetchingNextPage: loadingMoreDays,
  } = useDailyWorkouts(weekId)
  const { data: comments = [], isLoading: commentsLoading } = useWeekComments(weekId)
  const { mutateAsync: addComment, isPending: addingComment } = useAddWeekComment(weekId)
  const { mutate: deleteComment, isPending: deletingComment } = useDeleteWeekComment(weekId)

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

  const orderedDays = [...(days ?? [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
  const warnedDayIds = new Set(orderedDays.filter((day) => day.hasWarning).map((day) => day.id))
  const weekHasWarning = warnedDayIds.size > 0

  if (weeksError || daysError) return <NotFoundPage />

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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link to={`/plans/${planId}`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft size={16} />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="break-words text-2xl font-bold text-text">
                {currentWeek ? `${tw.title} ${currentWeek.weekNumber}` : tw.title}
              </h1>
              <InlineTip placement="week-detail" />
            </div>
            {currentWeek && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>
                {format(new Date(currentWeek.startDate), 'd MMM', { locale: dateLocale })}
                {' — '}
                {format(new Date(currentWeek.endDate), 'd MMM yyyy', { locale: dateLocale })}
              </p>
            )}
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-shrink-0 lg:justify-end">
          <Link to={`/plans/${planId}/weeks/${weekId}/analyze`}>
            <Button variant="primary" size="sm" className="w-full min-[390px]:w-auto">
              <BarChart2 size={15} />
              Analyze
            </Button>
          </Link>

          {allWeeks && allWeeks.length > 1 && (
            <div className="flex flex-1 items-center justify-end gap-1 min-[390px]:flex-none">
              <button
                disabled={!prevWeek}
                onClick={() =>
                  prevWeek &&
                  navigate(`/plans/${planId}/weeks/${prevWeek.id}`, { state: { canEdit, canComplete } })
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
                disabled={!nextWeek && !hasMoreWeeks}
                onClick={() =>
                  nextWeek
                    ? navigate(`/plans/${planId}/weeks/${nextWeek.id}`, { state: { canEdit, canComplete } })
                    : void fetchMoreWeeks()
                }
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                  nextWeek || hasMoreWeeks ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-30',
                )}
                style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
              >
                {nextWeek ? `W${nextWeek.weekNumber}` : loadingMoreWeeks ? '...' : hasMoreWeeks ? 'More' : ''}
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-6">
      {/* Weekly completion progress */}
      {currentWeek && currentWeek.effectiveTotalDays > 0 && (() => {
        const effective = currentWeek.effectiveTotalDays
        const pct       = Math.round((currentWeek.completedDays / effective) * 100)
        const weekDone  = currentWeek.isCompleted
        return (
          <div
            className="rounded-xl px-4 py-3 space-y-2"
            style={{ background: 'var(--bg-2)', border: `1px solid ${weekDone ? 'var(--xn-success)' : 'var(--border-1)'}` }}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-text">
                {weekDone ? '✓ Week Complete' : tw.weeklyCompletion}
              </span>
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
              {currentWeek.completedDays} / {effective} {tc.days} · {tw.daysCompleted}
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

      {/* Calendar list on phones */}
      <motion.div
        initial={shouldReduce ? false : 'hidden'}
        animate="visible"
        variants={staggerContainer}
        className="space-y-2 sm:hidden"
      >
        {orderedDays.map((day) => {
          const isToday =
            format(new Date(day.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          const dayWarned = warnedDayIds.has(day.id)

          return (
            <motion.div
              key={day.id}
              variants={slideUp}
              className="overflow-hidden rounded-xl border"
              style={{
                borderColor: dayWarned ? 'var(--color-warning)' : 'var(--border-1)',
                background: day.isCompleted
                  ? 'var(--xn-sage-200)'
                  : day.status === 'Rest'
                  ? 'var(--xn-clay-200)'
                  : day.status === 'Missed'
                  ? 'rgba(239,68,68,0.07)'
                  : 'var(--bg-2)',
              }}
            >
              <Link
                to={`/days/${day.id}`}
                state={{ canEdit, canComplete, weeklyWorkoutId: day.weeklyWorkoutId, planId }}
                className="flex items-center gap-3 p-3"
              >
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl" style={isToday ? { background: 'var(--color-primary)', color: 'white' } : { background: 'var(--bg-3)', color: 'var(--fg-1)' }}>
                  <span className="text-sm font-bold">{format(new Date(day.date), 'd')}</span>
                  <span className="text-[10px] uppercase">{format(new Date(day.date), 'EEE', { locale: dateLocale })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text">{day.dayOfWeek}</p>
                  <p className="text-xs text-muted">
                    {day.totalExercises > 0 ? `${day.totalExercises} ${tc.exercises}` : 'Rest'}
                    {day.totalExercises > 0 && ` · ${day.completedExercises}/${day.totalExercises}`}
                  </p>
                </div>
                {dayWarned ? (
                  <AlertTriangle size={17} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                ) : day.isCompleted ? (
                  <CheckCircle2 size={17} style={{ color: 'var(--xn-success)', flexShrink: 0 }} />
                ) : day.status === 'Rest' ? (
                  <BedDouble size={17} style={{ color: 'var(--xn-clay-600)', flexShrink: 0 }} />
                ) : day.status === 'Missed' ? (
                  <XCircle size={17} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
                ) : (
                  <ChevronRight size={16} style={{ color: 'var(--fg-3)', flexShrink: 0 }} />
                )}
              </Link>
            </motion.div>
          )
        })}
      </motion.div>
      {hasMoreDays && (
        <div className="flex justify-center sm:hidden">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={loadingMoreDays}
            onClick={() => void fetchMoreDays()}
          >
            Load more days
          </Button>
        </div>
      )}

      {/* Calendar grid */}
      <motion.div
        initial={shouldReduce ? false : 'hidden'}
        animate="visible"
        variants={staggerContainer}
        className="hidden overflow-hidden rounded-2xl border sm:block"
        style={{ borderColor: 'var(--border-1)', background: 'var(--border-1)' }}
      >
        {/* Day-of-week header row */}
        <div className="grid grid-cols-7 gap-px">
          {orderedDays.map((day) => (
            <div
              key={day.id}
              className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-widest"
              style={{ background: 'var(--bg-2)', color: 'var(--fg-3)' }}
            >
              {format(new Date(day.date), 'EEE', { locale: dateLocale })}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px">
          {orderedDays.map((day) => {
            const isToday =
              format(new Date(day.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
            const dayWarned = warnedDayIds.has(day.id)

            return (
              <motion.div
                key={day.id}
                variants={slideUp}
                className="relative min-h-36"
                style={
                  day.isCompleted
                    ? { background: 'var(--xn-sage-200)' }
                    : day.status === 'Rest'
                    ? { background: 'var(--xn-clay-200)' }
                    : day.status === 'Missed'
                    ? { background: 'rgba(239,68,68,0.07)' }
                    : { background: 'var(--bg-2)' }
                }
              >
                <Link
                  to={`/days/${day.id}`}
                  state={{ canEdit, canComplete, weeklyWorkoutId: day.weeklyWorkoutId, planId }}
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
                    ) : day.status === 'Rest' ? (
                      <BedDouble size={15} style={{ color: 'var(--xn-clay-600)', flexShrink: 0 }} />
                    ) : day.status === 'Missed' ? (
                      <XCircle size={15} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
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

                  {!day.isCompleted && day.status === 'Rest' && (
                    <div
                      className="mt-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium"
                      style={{ background: 'var(--xn-clay-300)', color: 'var(--xn-clay-800)' }}
                    >
                      <BedDouble size={11} />
                      Rest Day
                    </div>
                  )}

                  {!day.isCompleted && day.status === 'Missed' && (
                    <div
                      className="mt-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium"
                      style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--color-danger)' }}
                    >
                      <XCircle size={11} />
                      Missed
                    </div>
                  )}

                  {!day.isCompleted && day.status === 'Normal' && day.totalExercises > 0 && (
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
      {hasMoreDays && (
        <div className="hidden justify-center sm:flex">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={loadingMoreDays}
            onClick={() => void fetchMoreDays()}
          >
            Load more days
          </Button>
        </div>
      )}

        </div>

        <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
          <CommentSection
            comments={comments}
            isLoading={commentsLoading}
            onAdd={(content) => addComment(content)}
            onDelete={(id) => deleteComment(id)}
            isPendingAdd={addingComment}
            isPendingDelete={deletingComment}
          />
        </aside>
      </div>
    </div>
  )
}
