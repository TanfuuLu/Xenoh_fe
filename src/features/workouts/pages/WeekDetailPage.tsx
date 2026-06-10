import { useParams, Link, useLocation, useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, BarChart2, BedDouble, XCircle, type LucideIcon } from 'lucide-react'
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
import { usePlan } from '@/features/plans'
import { useMyProfile } from '@/features/profile'
import { useCycleDayMarkers, MARKER_STYLE } from '@/features/cycle'
import type { CycleDayMarker } from '@/features/cycle'
import { InlineTip } from '@/features/tips'
import { CommentSection } from '@/features/comments/components/CommentSection'
import { useWeekComments, useAddWeekComment, useDeleteWeekComment } from '@/features/comments/api/useWeekComments'
import { WeekSnapshotCard } from '../components/WeekSnapshotCard'
import type { DailyWorkoutResponse } from '../types'

interface DayVisual {
  cardBg: string
  accent: string
  Icon: LucideIcon | null
  iconColor: string
}

/** Resolve the colour treatment + status icon for a single day cell. */
function getDayVisual(day: DailyWorkoutResponse, warned: boolean): DayVisual {
  const cardBg = day.isCompleted
    ? 'var(--xn-sage-200)'
    : day.status === 'Rest'
    ? 'var(--xn-clay-200)'
    : day.status === 'Missed'
    ? 'rgba(239,68,68,0.06)'
    : 'var(--bg-2)'

  // Icon + accent precedence: a warning overrides the base status.
  if (warned) return { cardBg, accent: 'var(--color-warning)', Icon: AlertTriangle, iconColor: 'var(--color-warning)' }
  if (day.isCompleted) return { cardBg, accent: 'var(--xn-success)', Icon: CheckCircle2, iconColor: 'var(--xn-success)' }
  if (day.status === 'Rest') return { cardBg, accent: 'var(--xn-clay-400)', Icon: BedDouble, iconColor: 'var(--xn-clay-600)' }
  if (day.status === 'Missed') return { cardBg, accent: 'var(--color-danger)', Icon: XCircle, iconColor: 'var(--color-danger)' }
  return { cardBg, accent: 'var(--color-primary)', Icon: null, iconColor: 'var(--fg-3)' }
}

/** Compact menstrual / pre-menstrual chip overlaid on a plan day. */
function CycleMarkerPill({ marker, label }: { marker: CycleDayMarker; label: string }) {
  const { accent, tint } = MARKER_STYLE[marker]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
      style={{ background: tint, color: accent }}
      title={label}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
      {label}
    </span>
  )
}

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
  const { data: plan } = usePlan(planId)
  // Week comments are the coach ↔ client channel — only meaningful on coach plans.
  const showComments = plan?.planType === 'Coach'
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

  // Cycle-aware overlay: mark menstrual / pre-menstrual days for female users.
  const { data: profile } = useMyProfile()
  const isFemale = profile?.gender === 'Female'
  const rangeFrom = currentWeek ? currentWeek.startDate.slice(0, 10) : ''
  const rangeTo = currentWeek ? currentWeek.endDate.slice(0, 10) : ''
  const { data: cycleMarkers } = useCycleDayMarkers(rangeFrom, rangeTo, isFemale)
  const markerByDate = new Map<string, CycleDayMarker>(
    (cycleMarkers?.days ?? []).map((d) => [d.date.slice(0, 10), d.marker]),
  )

  const orderedDays = [...(days ?? [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
  const warnedDayIds = new Set(orderedDays.filter((day) => day.hasWarning).map((day) => day.id))
  const weekHasWarning = warnedDayIds.size > 0
  const restCount = orderedDays.filter((day) => day.status === 'Rest').length
  const missedCount = orderedDays.filter((day) => !day.isCompleted && day.status === 'Missed').length

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
            <div
              className="flex flex-1 items-center justify-end gap-1 rounded-full p-1 min-[390px]:flex-none"
              style={{ background: 'var(--bg-3)' }}
            >
              <button
                disabled={!prevWeek}
                onClick={() =>
                  prevWeek &&
                  navigate(`/plans/${planId}/weeks/${prevWeek.id}`, { state: { canEdit, canComplete } })
                }
                className={cn(
                  'flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors',
                  prevWeek ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-30',
                )}
                style={{ color: 'var(--fg-2)' }}
              >
                <ChevronLeft size={14} />
                {prevWeek ? `W${prevWeek.weekNumber}` : ''}
              </button>

              <span
                className="rounded-full px-3 py-1.5 text-xs font-bold"
                style={{ background: 'var(--xn-paper)', color: 'var(--fg-1)', boxShadow: 'var(--sh-xs)' }}
              >
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
                  'flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors',
                  nextWeek || hasMoreWeeks ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-30',
                )}
                style={{ color: 'var(--fg-2)' }}
              >
                {nextWeek ? `W${nextWeek.weekNumber}` : loadingMoreWeeks ? '...' : hasMoreWeeks ? 'More' : ''}
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
      {/* Weekly summary: completion ring-style header + quick stats */}
      {currentWeek && currentWeek.effectiveTotalDays > 0 && (() => {
        const effective = currentWeek.effectiveTotalDays
        const pct       = Math.round((currentWeek.completedDays / effective) * 100)
        const weekDone  = currentWeek.isCompleted
        const accent    = weekDone ? 'var(--xn-success)' : 'var(--color-primary)'
        return (
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="rounded-2xl border p-5"
            style={{ background: 'var(--bg-2)', borderColor: weekDone ? 'var(--xn-sage-400)' : 'var(--border-1)' }}
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--fg-3)' }}>
                  {weekDone ? tw.completed : tw.weeklyCompletion}
                </p>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-4xl font-bold leading-none" style={{ color: accent }}>
                    {pct}%
                  </span>
                  <span className="text-sm text-muted">
                    {currentWeek.completedDays}/{effective} {tc.days}
                  </span>
                </div>
              </div>

              {/* Quick stat chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{ background: 'var(--xn-sage-200)', color: '#5d6635' }}
                >
                  <CheckCircle2 size={13} />
                  {currentWeek.completedDays} · {tw.completed}
                </span>
                {restCount > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{ background: 'var(--xn-clay-200)', color: 'var(--xn-clay-800)' }}
                  >
                    <BedDouble size={13} />
                    {restCount} · Rest
                  </span>
                )}
                {missedCount > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--color-danger)' }}
                  >
                    <XCircle size={13} />
                    {missedCount} · Missed
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--border-1)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: accent }}
              />
            </div>
          </motion.div>
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

      {/* Cycle legend (female users with markers in this week) */}
      {isFemale && (cycleMarkers?.days.length ?? 0) > 0 && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5"
          style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}
        >
          <CycleMarkerPill marker="Menstrual" label={tw.cyclePeriod} />
          <CycleMarkerPill marker="PreMenstrual" label={tw.cyclePreMenstrual} />
          <span className="text-xs text-muted">{tw.cycleMarkerHint}</span>
        </div>
      )}

      {/* Calendar list on phones */}
      <motion.div
        initial={shouldReduce ? false : 'hidden'}
        animate="visible"
        variants={staggerContainer}
        className="space-y-2.5 sm:hidden"
      >
        {orderedDays.map((day) => {
          const isToday =
            format(new Date(day.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          const dayWarned = warnedDayIds.has(day.id)
          const v = getDayVisual(day, dayWarned)
          const marker = markerByDate.get(day.date.slice(0, 10))

          return (
            <motion.div
              key={day.id}
              variants={slideUp}
              className="relative overflow-hidden rounded-2xl border"
              style={{
                borderColor: 'var(--border-1)',
                background: marker ? MARKER_STYLE[marker].tint : v.cardBg,
              }}
            >
              <span className="absolute inset-y-0 left-0 w-1" style={{ background: v.accent }} />
              <Link
                to={`/days/${day.id}`}
                state={{ canEdit, canComplete, weeklyWorkoutId: day.weeklyWorkoutId, planId }}
                className="flex items-center gap-3 py-3 pl-4 pr-3"
              >
                <div
                  className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
                  style={isToday ? { background: 'var(--color-primary)', color: 'white' } : { background: 'var(--bg-3)', color: 'var(--fg-1)' }}
                >
                  <span className="text-sm font-bold">{format(new Date(day.date), 'd')}</span>
                  <span className="text-[10px] uppercase">{format(new Date(day.date), 'EEE', { locale: dateLocale })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-text">{day.dayOfWeek}</p>
                    {marker && (
                      <CycleMarkerPill
                        marker={marker}
                        label={marker === 'Menstrual' ? tw.cyclePeriod : tw.cyclePreMenstrual}
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted">
                    {day.totalExercises > 0 ? `${day.totalExercises} ${tc.exercises}` : 'Rest'}
                    {day.totalExercises > 0 && ` · ${day.completedExercises}/${day.totalExercises}`}
                  </p>
                </div>
                {v.Icon ? (
                  <v.Icon size={18} style={{ color: v.iconColor, flexShrink: 0 }} />
                ) : day.totalExercises > 0 ? (
                  <Badge variant="warning">
                    {day.completedExercises}/{day.totalExercises}
                  </Badge>
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

      {/* Calendar grid (tablet / desktop) */}
      <motion.div
        initial={shouldReduce ? false : 'hidden'}
        animate="visible"
        variants={staggerContainer}
        className="hidden grid-cols-7 gap-2.5 sm:grid"
      >
        {orderedDays.map((day) => {
          const isToday =
            format(new Date(day.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          const dayWarned = warnedDayIds.has(day.id)
          const v = getDayVisual(day, dayWarned)
          const marker = markerByDate.get(day.date.slice(0, 10))

          return (
            <motion.div
              key={day.id}
              variants={slideUp}
              whileHover={shouldReduce ? undefined : { y: -3 }}
              className="min-w-0"
            >
              <Link
                to={`/days/${day.id}`}
                state={{ canEdit, canComplete, weeklyWorkoutId: day.weeklyWorkoutId, planId }}
                className="relative flex h-full min-h-40 flex-col overflow-hidden rounded-2xl border p-3 transition-shadow hover:shadow-md"
                style={{
                  background: marker ? MARKER_STYLE[marker].tint : v.cardBg,
                  borderColor: isToday ? 'var(--color-primary)' : 'var(--border-1)',
                  boxShadow: isToday ? '0 0 0 1px var(--color-primary)' : undefined,
                }}
              >
                {/* Top accent strip */}
                <span className="absolute inset-x-0 top-0 h-1" style={{ background: v.accent }} />

                {/* Weekday label + status icon */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: isToday ? 'var(--color-primary)' : 'var(--fg-3)' }}
                  >
                    {format(new Date(day.date), 'EEE', { locale: dateLocale })}
                  </span>
                  {v.Icon ? (
                    <v.Icon size={15} style={{ color: v.iconColor, flexShrink: 0 }} />
                  ) : day.totalExercises > 0 ? (
                    <Badge variant="warning">
                      {day.completedExercises}/{day.totalExercises}
                    </Badge>
                  ) : null}
                </div>

                {/* Date number */}
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      'inline-flex h-8 min-w-8 items-center justify-center rounded-full px-1 text-base font-bold',
                      isToday ? 'text-white' : day.isCompleted ? 'text-success' : 'text-text',
                    )}
                    style={isToday ? { background: 'var(--color-primary)' } : undefined}
                  >
                    {format(new Date(day.date), 'd')}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--fg-3)' }}>
                    {format(new Date(day.date), 'MMM', { locale: dateLocale })}
                  </span>
                </div>

                {/* Cycle marker */}
                {marker && (
                  <div className="mt-1.5">
                    <CycleMarkerPill
                      marker={marker}
                      label={marker === 'Menstrual' ? tw.cyclePeriod : tw.cyclePreMenstrual}
                    />
                  </div>
                )}

                {/* Exercise count */}
                {day.totalExercises > 0 ? (
                  <p className="mt-1 text-xs" style={{ color: 'var(--fg-3)' }}>
                    {day.totalExercises} {tc.exercises}
                  </p>
                ) : (
                  <p className="mt-1 text-xs" style={{ color: 'var(--fg-3)', opacity: 0.5 }}>
                    Rest
                  </p>
                )}

                {/* Footer status pill */}
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

      {/* Bottom row — week snapshot, plus comments only on coach plans */}
      {showComments ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <CommentSection
            comments={comments}
            isLoading={commentsLoading}
            onAdd={(content) => addComment(content)}
            onDelete={(id) => deleteComment(id)}
            isPendingAdd={addingComment}
            isPendingDelete={deletingComment}
          />
          <WeekSnapshotCard weekId={weekId} planId={planId} />
        </div>
      ) : (
        <div className="lg:max-w-sm">
          <WeekSnapshotCard weekId={weekId} planId={planId} />
        </div>
      )}
    </div>
  )
}
