import { useParams, Link } from 'react-router'
import { useQueries } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, CheckCircle2, AlertTriangle, Dumbbell, TrendingUp, Calendar, Zap, BedDouble, XCircle, Flame, Timer, Activity, Info } from 'lucide-react'
import { format } from 'date-fns'
import { vi as viLocale, enUS } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { Button } from '@/shared/components/Button'
import { Spinner } from '@/shared/components/Spinner'
import { NotFoundPage } from '@/shared/components/NotFoundPage'
import { motionProps, staggerContainer, slideUp } from '@/shared/utils/motion'
import { useT, useLangStore } from '@/shared/i18n'
import { RequireTier } from '@/features/billing/components/RequireTier'
import { useDailyWorkouts, useWeeklyWorkouts } from '../index'
import type { ExerciseResponse } from '../types'

function calcActualVolume(exercises: ExerciseResponse[]): number {
  return exercises.reduce((total, ex) => {
    const setVol = ex.sets.reduce((s, set) => {
      if (!set.isCompleted) return s
      const reps = set.actualReps ?? set.plannedReps
      const weight = set.actualWeight ?? set.plannedWeight ?? 0
      return s + reps * weight
    }, 0)
    return total + setVol
  }, 0)
}

function calcPlannedVolume(exercises: ExerciseResponse[]): number {
  return exercises.reduce((total, ex) => {
    return total + ex.plannedSets * ex.plannedReps * (ex.plannedWeight ?? 0)
  }, 0)
}

function calcEstimatedCalories(exercises: ExerciseResponse[]): number {
  return exercises.reduce((total, ex) => total + (ex.estimatedCalories ?? 0), 0)
}

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

function collectMuscleGroups(exercises: ExerciseResponse[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const ex of exercises) {
    counts.set(ex.primaryMuscleGroup, (counts.get(ex.primaryMuscleGroup) ?? 0) + 1)
    for (const mg of ex.secondaryMuscleGroups) {
      counts.set(mg, (counts.get(mg) ?? 0) + 0.5)
    }
  }
  return counts
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  accent?: string
}

function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <motion.div
      variants={slideUp}
      className="rounded-xl p-4 flex items-start gap-3"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-lg"
        style={{ width: 36, height: 36, background: accent ?? 'var(--bg-3)', color: 'var(--color-primary)' }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs" style={{ color: 'var(--fg-3)', marginBottom: 2 }}>{label}</p>
        <p className="text-xl font-bold text-text">{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>{sub}</p>}
      </div>
    </motion.div>
  )
}

const MUSCLE_COLORS: Record<string, string> = {
  Chest: '#6366f1',
  Back: '#22c55e',
  Shoulders: '#f59e0b',
  Biceps: '#ec4899',
  Triceps: '#14b8a6',
  Forearms: '#8b5cf6',
  Quadriceps: '#f97316',
  Hamstrings: '#06b6d4',
  Glutes: '#e11d48',
  Calves: '#84cc16',
  Core: '#a78bfa',
  FullBody: '#94a3b8',
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-3 py-2 text-sm shadow-lg"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
    >
      <p className="font-semibold text-text mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString()} kg·rep
        </p>
      ))}
    </div>
  )
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
      queryKey: ['exercises', day.id],
      queryFn: () =>
        api.get<ExerciseResponse[]>(ENDPOINTS.exercises.byDay(day.id)).then((r) => r.data),
      staleTime: 60_000,
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
    return {
      day: dayLabel,
      planned: Math.round(calcPlannedVolume(exs)),
      actual: Math.round(calcActualVolume(exs)),
      calories: Math.round(calcEstimatedCalories(exs)),
      isCompleted: day.isCompleted,
      hasWarning: day.hasWarning,
      isRest: day.totalExercises === 0,
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
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
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

type WeekInsightSeverity = 'Info' | 'Warning' | 'Critical' | 'Positive'

interface WeekInsight {
  severity: WeekInsightSeverity
  title: string
  message: string
  metricLabel: string
  metricValue: string
}

function buildWeekInsights({
  completionPct,
  volumeRatio,
  warnDays,
  missedDays,
  restDays,
  weekAverageRpe,
  muscleEntries,
  totalMuscleScore,
  ta,
}: {
  completionPct: number
  volumeRatio: number
  warnDays: number
  missedDays: number
  restDays: number
  weekAverageRpe: number | null
  muscleEntries: [string, number][]
  totalMuscleScore: number
  ta: ReturnType<typeof useT>['weekAnalyze']
}): WeekInsight[] {
  const insights: WeekInsight[] = []

  if (completionPct < 50 || missedDays >= 2) {
    insights.push({
      severity: 'Critical',
      title: ta.insightRepeatTitle,
      message: ta.insightRepeatMsg,
      metricLabel: ta.completion,
      metricValue: `${completionPct}%`,
    })
  } else if (completionPct < 85 || warnDays > 0) {
    insights.push({
      severity: 'Warning',
      title: ta.insightHoldTitle,
      message: ta.insightHoldMsg,
      metricLabel: ta.warnings,
      metricValue: String(warnDays),
    })
  } else {
    insights.push({
      severity: 'Positive',
      title: ta.insightProgressTitle,
      message: ta.insightProgressMsg,
      metricLabel: ta.completion,
      metricValue: `${completionPct}%`,
    })
  }

  if (volumeRatio > 130) {
    insights.push({
      severity: 'Warning',
      title: ta.insightVolumeHighTitle,
      message: ta.insightVolumeHighMsg,
      metricLabel: ta.volumeVsPlanLabel,
      metricValue: `${volumeRatio}%`,
    })
  } else if (volumeRatio > 0 && volumeRatio < 80) {
    insights.push({
      severity: 'Warning',
      title: ta.insightVolumeLowTitle,
      message: ta.insightVolumeLowMsg,
      metricLabel: ta.volumeVsPlanLabel,
      metricValue: `${volumeRatio}%`,
    })
  }

  if (weekAverageRpe != null && weekAverageRpe >= 8.5) {
    insights.push({
      severity: 'Warning',
      title: ta.insightFatigueTitle,
      message: ta.insightFatigueMsg,
      metricLabel: ta.avgRpe,
      metricValue: weekAverageRpe.toFixed(1),
    })
  }

  const topMuscle = muscleEntries[0]
  if (topMuscle && totalMuscleScore > 0) {
    const topPercent = Math.round((topMuscle[1] / totalMuscleScore) * 100)
    if (topPercent > 45) {
      insights.push({
        severity: 'Warning',
        title: ta.insightNarrowTitle,
        message: ta.insightNarrowMsg.replace('{muscle}', topMuscle[0]),
        metricLabel: topMuscle[0],
        metricValue: `${topPercent}%`,
      })
    }
  }

  if (restDays === 0 && completionPct >= 85 && weekAverageRpe != null && weekAverageRpe >= 8) {
    insights.push({
      severity: 'Info',
      title: ta.insightRecoveryTitle,
      message: ta.insightRecoveryMsg,
      metricLabel: ta.restDaysLabel,
      metricValue: '0',
    })
  }

  return insights.slice(0, 3)
}

function WeekInsightCard({ insight }: { insight: WeekInsight }) {
  const styles = weekInsightStyle(insight.severity)
  const Icon = styles.icon
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: styles.border, background: styles.background }}
    >
      <div className="mb-3 flex items-start gap-2">
        <Icon size={17} style={{ color: styles.color, marginTop: 2, flexShrink: 0 }} />
        <div>
          <p className="font-semibold text-text">{insight.title}</p>
          <p className="mt-1 text-sm text-muted">{insight.message}</p>
        </div>
      </div>
      <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}>
        <span className="text-muted">{insight.metricLabel}: </span>
        <span className="font-semibold">{insight.metricValue}</span>
      </div>
    </div>
  )
}

function weekInsightStyle(severity: WeekInsightSeverity) {
  if (severity === 'Critical') {
    return {
      icon: AlertTriangle,
      color: 'var(--color-danger)',
      border: 'rgba(239,68,68,0.28)',
      background: 'rgba(239,68,68,0.08)',
    }
  }
  if (severity === 'Warning') {
    return {
      icon: AlertTriangle,
      color: 'var(--color-warning)',
      border: 'rgba(245,158,11,0.28)',
      background: 'rgba(245,158,11,0.08)',
    }
  }
  if (severity === 'Positive') {
    return {
      icon: CheckCircle2,
      color: 'var(--color-success)',
      border: 'rgba(34,197,94,0.25)',
      background: 'rgba(34,197,94,0.08)',
    }
  }
  return {
    icon: Info,
    color: 'var(--color-primary)',
    border: 'var(--border-1)',
    background: 'var(--bg-3)',
  }
}
