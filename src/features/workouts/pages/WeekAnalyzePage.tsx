import { useParams, Link } from 'react-router'
import { useQueries } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, CheckCircle2, AlertTriangle, Dumbbell, TrendingUp, Calendar, Zap, BedDouble, XCircle, Flame, Timer, Activity } from 'lucide-react'
import { format } from 'date-fns'
import { vi as viLocale, enUS } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { PagedResponse } from '@/shared/types/api'
import { Button } from '@/shared/components/Button'
import { Spinner } from '@/shared/components/Spinner'
import { NotFoundPage } from '@/shared/components/NotFoundPage'
import { motionProps, staggerContainer } from '@/shared/utils/motion'
import { useT, useLangStore } from '@/shared/i18n'
import { RequireTier } from '@/features/billing/components/RequireTier'
import { exerciseKeys, useDailyWorkouts, useWeeklyWorkouts } from '../index'
import type { ExerciseResponse } from '../types'
import { StatCard, CustomTooltip, WeekInsightCard } from '../components/WeekAnalyzeCards'
import { WeeklyDiagramGrid } from '../components/WeeklyDiagramGrid'
import {
  MUSCLE_COLORS,
  calcActualVolume,
  calcPlannedVolume,
  calcEstimatedCalories,
  calcTotalDuration,
  calcAverageRpe,
  collectMuscleGroups,
  formatDuration,
  buildWeekInsights,
} from '../components/weekAnalyzeHelpers'

const WEEK_ANALYZE_EXERCISE_PAGE_SIZE = 100

async function fetchExercisesForWeekAnalyze(dayId: string) {
  const allExercises: ExerciseResponse[] = []
  let pageNumber = 1
  let hasMore = true

  while (hasMore) {
    const page = await api
      .get<PagedResponse<ExerciseResponse>>(ENDPOINTS.exercises.byDay(dayId), {
        params: { pageNumber, pageSize: WEEK_ANALYZE_EXERCISE_PAGE_SIZE },
      })
      .then((r) => r.data)

    allExercises.push(...page.items)
    hasMore = page.hasMore
    pageNumber += 1
  }

  return allExercises
}

export function WeekAnalyzePage() {
  const { planId = '', weekId = '' } = useParams()
  const shouldReduce = useReducedMotion()
  const lang = useLangStore((s) => s.lang)
  const dateLocale = lang === 'vi' ? viLocale : enUS
  const t = useT()
  const ta = t.weekAnalyze

  const { data: allWeeks, isError: weeksError } = useWeeklyWorkouts(planId)
  const { data: days, isLoading: daysLoading, isError: daysError } = useDailyWorkouts(weekId)

  const currentWeek = allWeeks?.find((w) => w.id === weekId)
  const orderedDays = [...(days ?? [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  const daysWithExercises = days?.filter((d) => d.totalExercises > 0) ?? []
  const exerciseQueries = useQueries({
    queries: daysWithExercises.map((day) => ({
      queryKey: [...exerciseKeys.byDay(day.id), 'week-analyze'],
      queryFn: () => fetchExercisesForWeekAnalyze(day.id),
    })),
  })

  const allLoading = daysLoading || exerciseQueries.some((q) => q.isLoading)

  if (weeksError || daysError) return <NotFoundPage />
  if (allLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // Build exercise map: dayId → exercises
  const exercisesByDayId = new Map<string, ExerciseResponse[]>()
  daysWithExercises.forEach((day, i) => {
    if (exerciseQueries[i].data) {
      exercisesByDayId.set(day.id, exerciseQueries[i].data!)
    }
  })

  // Chart data: one bar per day
  const chartData = orderedDays.map((day) => {
    const exs = exercisesByDayId.get(day.id) ?? []
    const dayLabel = format(new Date(day.date), 'EEE d', { locale: dateLocale })
    const completedSets = exs.flatMap((ex) => ex.sets).filter((set) => set.isCompleted).length
    const totalSets = exs.reduce((sum, ex) => sum + ex.sets.length, 0)
    return {
      id: day.id,
      day: dayLabel,
      planned: Math.round(calcPlannedVolume(exs)),
      actual: Math.round(calcActualVolume(exs)),
      calories: Math.round(calcEstimatedCalories(exs)),
      durationSeconds: calcTotalDuration(exs),
      avgRpe: calcAverageRpe(exs),
      completedSets,
      totalSets,
      isCompleted: day.isCompleted,
      hasWarning: day.hasWarning,
      isRest: day.totalExercises === 0,
      status: day.status,
    }
  })

  // Stats
  const trainedDays = orderedDays.filter((d) => d.isCompleted).length
  const warnDays = orderedDays.filter((d) => d.hasWarning).length
  const restDays = orderedDays.filter((d) => d.status === 'Rest').length
  const missedDays = orderedDays.filter((d) => d.status === 'Missed').length
  const totalActualVol = chartData.reduce((s, d) => s + d.actual, 0)
  const totalPlannedVol = chartData.reduce((s, d) => s + d.planned, 0)
  const totalEstimatedCalories = chartData.reduce((s, d) => s + d.calories, 0)
  const completionPct = currentWeek && currentWeek.effectiveTotalDays > 0
    ? Math.round((currentWeek.completedDays / currentWeek.effectiveTotalDays) * 100)
    : 0

  // Muscle group distribution (across whole week)
  const allExercises = [...exercisesByDayId.values()].flat()
  const totalDurationSeconds = calcTotalDuration(allExercises)
  const weekAverageRpe = calcAverageRpe(allExercises)
  const muscleCounts = collectMuscleGroups(allExercises)
  const muscleEntries = [...muscleCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count > 0)

  const totalMuscleScore = muscleEntries.reduce((s, [, c]) => s + c, 0)

  const volumeRatio = totalPlannedVol > 0
    ? Math.round((totalActualVol / totalPlannedVol) * 100)
    : 0
  const weekInsights = buildWeekInsights({
    completionPct,
    volumeRatio,
    warnDays,
    missedDays,
    restDays,
    weekAverageRpe,
    muscleEntries,
    totalMuscleScore,
    ta,
  })

  return (
    <RequireTier feature="Week Analysis">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to={`/plans/${planId}/weeks/${weekId}`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft size={16} />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold text-text">
            {ta.title}
            {currentWeek && (
              <span className="block text-lg font-normal sm:ml-2 sm:inline" style={{ color: 'var(--fg-3)' }}>
                — {ta.week} {currentWeek.weekNumber}
              </span>
            )}
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

      {/* Stat cards */}
      <motion.div
        initial={shouldReduce ? false : 'hidden'}
        animate="visible"
        variants={staggerContainer}
        className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
      >
        <StatCard
          icon={<Calendar size={18} />}
          label={ta.daysCompleted}
          value={`${currentWeek?.completedDays ?? 0} / ${currentWeek?.effectiveTotalDays ?? orderedDays.length}`}
          sub={`${completionPct}% · ${trainedDays} ${trainedDays !== 1 ? ta.workoutDays : ta.workoutDay}`}
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label={ta.actualVolume}
          value={totalActualVol.toLocaleString()}
          sub={ta.kgReps}
        />
        <StatCard
          icon={<Zap size={18} />}
          label={ta.volumeVsPlan}
          value={`${volumeRatio}%`}
          sub={totalPlannedVol > 0 ? ta.ofPlanned.replace('{v}', totalPlannedVol.toLocaleString()) : ta.noPlanSet}
        />
        <StatCard
          icon={<Flame size={18} />}
          label={ta.estimatedCalories}
          value={totalEstimatedCalories > 0 ? totalEstimatedCalories.toLocaleString() : '—'}
          sub={totalEstimatedCalories > 0 ? ta.kcalThisWeek : ta.noTimedExercises}
        />
        <StatCard
          icon={<Timer size={18} />}
          label={ta.totalTime}
          value={totalDurationSeconds > 0 ? formatDuration(totalDurationSeconds) : '—'}
          sub={totalDurationSeconds > 0 ? ta.timedExercises : ta.noTimedExercises}
        />
        <StatCard
          icon={<Activity size={18} />}
          label={ta.avgRpe}
          value={weekAverageRpe != null ? weekAverageRpe.toFixed(1) : '—'}
          sub={weekAverageRpe != null ? ta.rpeDesc : ta.noRpeLogged}
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label={ta.belowTarget}
          value={warnDays}
          sub={warnDays === 1 ? ta.dayWithWarnings : ta.daysWithWarnings}
        />
        <StatCard
          icon={<BedDouble size={18} />}
          label={ta.restDays}
          value={restDays}
          sub={ta.intentionalRest}
          accent="var(--xn-clay-200)"
        />
        <StatCard
          icon={<XCircle size={18} />}
          label={ta.missedDays}
          value={missedDays}
          sub={missedDays === 1 ? ta.daySkipped : ta.daysSkipped}
          accent="rgba(239,68,68,0.1)"
        />
      </motion.div>

      {weekInsights.length > 0 && (
        <motion.div
          {...motionProps.slideUp}
          className="rounded-xl p-4 space-y-3"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
        >
          <div className="flex items-center gap-2">
            <Zap size={16} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-sm font-semibold text-text">{ta.recommendations}</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {weekInsights.map((insight) => (
              <WeekInsightCard key={insight.title} insight={insight} />
            ))}
          </div>
        </motion.div>
      )}

      <motion.div {...motionProps.slideUp}>
        <WeeklyDiagramGrid
          chartData={chartData}
          completionPct={completionPct}
          volumeRatio={volumeRatio}
          totalActualVol={totalActualVol}
          totalPlannedVol={totalPlannedVol}
          totalDurationSeconds={totalDurationSeconds}
          weekAverageRpe={weekAverageRpe}
          ta={ta}
        />
      </motion.div>

      {/* Training days visual */}
      <motion.div
        {...motionProps.slideUp}
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
      >
        <h2 className="text-sm font-semibold text-text">{ta.trainingDays}</h2>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:overflow-visible sm:pb-0">
          {orderedDays.map((day) => {
            const dayLabel = format(new Date(day.date), 'EEE', { locale: dateLocale })
            const isPending = day.totalExercises === 0 && day.status === 'Normal'
            const bg = day.isCompleted && !day.hasWarning
              ? 'var(--color-primary)'
              : day.hasWarning
              ? 'var(--color-warning)'
              : day.status === 'Rest'
              ? 'var(--xn-clay-300)'
              : day.status === 'Missed'
              ? 'rgba(239,68,68,0.18)'
              : 'var(--bg-3)'
            const textColor = (day.isCompleted || day.hasWarning) ? '#fff' : 'var(--fg-3)'

            return (
              <div key={day.id} className="flex min-w-10 flex-1 flex-col items-center gap-1">
                <div
                  className="w-full flex items-center justify-center rounded-lg text-xs font-semibold py-2"
                  style={{ background: bg, color: textColor, minWidth: 0 }}
                >
                  {day.isCompleted && !day.hasWarning ? (
                    <CheckCircle2 size={14} />
                  ) : day.hasWarning ? (
                    <AlertTriangle size={14} />
                  ) : day.status === 'Rest' ? (
                    <BedDouble size={14} style={{ color: 'var(--xn-clay-700)' }} />
                  ) : day.status === 'Missed' ? (
                    <XCircle size={14} style={{ color: 'var(--color-danger)' }} />
                  ) : isPending ? (
                    <span style={{ opacity: 0.4 }}>—</span>
                  ) : (
                    <Dumbbell size={13} />
                  )}
                </div>
                <span className="text-xs" style={{ color: 'var(--fg-3)' }}>{dayLabel}</span>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--fg-3)' }}>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'var(--color-primary)' }} />
            {ta.completedLegend}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'var(--color-warning)' }} />
            {ta.belowTargetLegend}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'var(--xn-clay-300)' }} />
            {ta.restDayLegend}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'rgba(239,68,68,0.18)' }} />
            {ta.missedLegend}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'var(--bg-3)' }} />
            {ta.pendingLegend}
          </span>
        </div>
      </motion.div>

      {/* Volume bar chart */}
      <motion.div
        {...motionProps.slideUp}
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
      >
        <h2 className="text-sm font-semibold text-text">{ta.volumeChart}</h2>
        {totalPlannedVol === 0 && totalActualVol === 0 ? (
          <p className="py-8 text-center text-sm text-muted">{ta.noExerciseData}</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'var(--fg-3)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--fg-3)' }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v: number) => Math.round(v).toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: 'var(--fg-3)', paddingTop: 8 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="planned" name={ta.planned} fill="var(--border-1)" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="actual" name={ta.actual} fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Calories chart */}
      <motion.div
        {...motionProps.slideUp}
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
      >
        <h2 className="text-sm font-semibold text-text">{ta.caloriesChart}</h2>
        {totalEstimatedCalories === 0 ? (
          <p className="py-8 text-center text-sm text-muted">{ta.noCaloriesData}</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'var(--fg-3)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--fg-3)' }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                formatter={(value) => [`${Number(value ?? 0).toLocaleString()} kcal`, ta.estimated]}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="calories" name={ta.estimated} fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Muscle group distribution */}
      {muscleEntries.length > 0 && (
        <motion.div
          {...motionProps.slideUp}
          className="rounded-xl p-4 space-y-3"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
        >
          <h2 className="text-sm font-semibold text-text">{ta.muscleFocus}</h2>
          <div className="space-y-2">
            {muscleEntries.map(([muscle, count]) => {
              const pct = totalMuscleScore > 0 ? Math.round((count / totalMuscleScore) * 100) : 0
              const color = MUSCLE_COLORS[muscle] ?? 'var(--color-primary)'
              return (
                <div key={muscle}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-text">{muscle}</span>
                    <span style={{ color: 'var(--fg-3)' }}>{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--bg-3)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {muscleEntries.map(([muscle]) => (
              <span
                key={muscle}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  background: `${MUSCLE_COLORS[muscle] ?? 'var(--color-primary)'}22`,
                  color: MUSCLE_COLORS[muscle] ?? 'var(--color-primary)',
                }}
              >
                {muscle}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
    </RequireTier>
  )
}
