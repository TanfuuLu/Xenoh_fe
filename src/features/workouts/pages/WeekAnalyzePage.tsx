import { useParams, Link } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, AlertTriangle, TrendingUp, Calendar, Zap, BedDouble, XCircle, Flame, Timer, Activity } from 'lucide-react'
import { format } from 'date-fns'
import { vi as viLocale, enUS } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Button } from '@/shared/components/Button'
import { Spinner } from '@/shared/components/Spinner'
import { NotFoundPage } from '@/shared/components/NotFoundPage'
import { motionProps, staggerContainer } from '@/shared/utils/motion'
import { useT, useLangStore } from '@/shared/i18n'
import { RequireTier } from '@/features/billing/components/RequireTier'
import { useDailyWorkouts, useWeeklyWorkouts, useWeekExercises } from '../index'
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

  const { data: weekExercises, isLoading: exercisesLoading } = useWeekExercises(weekId)

  const allLoading = daysLoading || exercisesLoading

  if (weeksError || daysError) return <NotFoundPage />
  if (allLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // Group the week's exercises by day
  const exercisesByDayId = new Map<string, ExerciseResponse[]>()
  for (const exercise of weekExercises ?? []) {
    const list = exercisesByDayId.get(exercise.dailyWorkoutId)
    if (list) list.push(exercise)
    else exercisesByDayId.set(exercise.dailyWorkoutId, [exercise])
  }

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
          iconColor="var(--ic-blue)"
          label={ta.daysCompleted}
          value={`${currentWeek?.completedDays ?? 0} / ${currentWeek?.effectiveTotalDays ?? orderedDays.length}`}
          sub={`${completionPct}% · ${trainedDays} ${trainedDays !== 1 ? ta.workoutDays : ta.workoutDay}`}
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          iconColor="var(--ic-green)"
          label={ta.actualVolume}
          value={totalActualVol.toLocaleString()}
          sub={ta.kgReps}
        />
        <StatCard
          icon={<Zap size={18} />}
          iconColor="var(--ic-purple)"
          label={ta.volumeVsPlan}
          value={`${volumeRatio}%`}
          sub={totalPlannedVol > 0 ? ta.ofPlanned.replace('{v}', totalPlannedVol.toLocaleString()) : ta.noPlanSet}
        />
        <StatCard
          icon={<Flame size={18} />}
          iconColor="var(--ic-orange)"
          label={ta.estimatedCalories}
          value={totalEstimatedCalories > 0 ? totalEstimatedCalories.toLocaleString() : '—'}
          sub={totalEstimatedCalories > 0 ? ta.kcalThisWeek : ta.noTimedExercises}
        />
        <StatCard
          icon={<Timer size={18} />}
          iconColor="var(--ic-cyan)"
          label={ta.totalTime}
          value={totalDurationSeconds > 0 ? formatDuration(totalDurationSeconds) : '—'}
          sub={totalDurationSeconds > 0 ? ta.timedExercises : ta.noTimedExercises}
        />
        <StatCard
          icon={<Activity size={18} />}
          iconColor="var(--ic-pink)"
          label={ta.avgRpe}
          value={weekAverageRpe != null ? weekAverageRpe.toFixed(1) : '—'}
          sub={weekAverageRpe != null ? ta.rpeDesc : ta.noRpeLogged}
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          iconColor="var(--ic-amber)"
          label={ta.belowTarget}
          value={warnDays}
          sub={warnDays === 1 ? ta.dayWithWarnings : ta.daysWithWarnings}
        />
        <StatCard
          icon={<BedDouble size={18} />}
          iconColor="var(--ic-cyan)"
          label={ta.restDays}
          value={restDays}
          sub={ta.intentionalRest}
        />
        <StatCard
          icon={<XCircle size={18} />}
          iconColor="var(--ic-red)"
          label={ta.missedDays}
          value={missedDays}
          sub={missedDays === 1 ? ta.daySkipped : ta.daysSkipped}
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

      {/* Charts — volume + calories side by side */}
      <motion.div {...motionProps.slideUp} className="grid gap-4 xl:grid-cols-2">
        {/* Volume bar chart */}
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-text">{ta.volumeChart}</h2>
            <span className="text-xs text-muted tabular-nums">
              {ta.actual}: <span className="font-semibold text-text">{totalActualVol.toLocaleString()}</span>
            </span>
          </div>
          {totalPlannedVol === 0 && totalActualVol === 0 ? (
            <p className="py-12 text-center text-sm text-muted">{ta.noExerciseData}</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={3}>
                <defs>
                  <linearGradient id="xn-vol-planned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--xn-clay-300)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="var(--xn-clay-300)" stopOpacity={0.55} />
                  </linearGradient>
                  <linearGradient id="xn-vol-actual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--fg-3)' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--fg-3)' }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v: number) => Math.round(v).toLocaleString()}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-3)', opacity: 0.5 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--fg-3)', paddingTop: 8 }} iconType="circle" iconSize={8} />
                <Bar dataKey="planned" name={ta.planned} fill="url(#xn-vol-planned)" radius={[5, 5, 0, 0]} maxBarSize={28} />
                <Bar dataKey="actual" name={ta.actual} fill="url(#xn-vol-actual)" radius={[5, 5, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Calories chart */}
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-text">{ta.caloriesChart}</h2>
            <span className="text-xs text-muted tabular-nums">
              <span className="font-semibold text-text">{totalEstimatedCalories.toLocaleString()}</span> kcal
            </span>
          </div>
          {totalEstimatedCalories === 0 ? (
            <p className="py-12 text-center text-sm text-muted">{ta.noCaloriesData}</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="xn-cal-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--xn-clay-600)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--xn-clay-600)" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--fg-3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--fg-3)' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  formatter={(value) => [`${Number(value ?? 0).toLocaleString()} kcal`, ta.estimated]}
                  cursor={{ fill: 'var(--bg-3)', opacity: 0.5 }}
                />
                <Bar dataKey="calories" name={ta.estimated} fill="url(#xn-cal-fill)" radius={[5, 5, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
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
