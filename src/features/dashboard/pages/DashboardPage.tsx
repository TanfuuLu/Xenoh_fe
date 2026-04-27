import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router'
import { Flame, TrendingUp, Calendar, ChevronRight, Dumbbell, CheckCircle2 } from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import { vi as viLocale, enUS } from 'date-fns/locale'
import { Card } from '@/shared/components/Card'
import { Badge } from '@/shared/components/Badge'
import { Spinner } from '@/shared/components/Spinner'
import { cn } from '@/shared/utils/cn'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useT, useLangStore } from '@/shared/i18n'
import { useMyProfile } from '@/features/profile'
import { usePlans } from '@/features/plans'
import { useWeeklyWorkouts, useDailyWorkouts } from '@/features/workouts'

export function DashboardPage() {
  const shouldReduce = useReducedMotion()
  const { data: profile, isLoading: profileLoading } = useMyProfile()
  const { data: plans, isLoading: plansLoading } = usePlans()
  const t   = useT()
  const td  = t.dashboard
  const tc  = t.common
  const lang = useLangStore((s) => s.lang)
  const dateLocale = lang === 'vi' ? viLocale : enUS

  const activePlan = plans?.find((p) => p.isActive)

  // Find this week in the active plan
  const { data: weeks } = useWeeklyWorkouts(activePlan?.id ?? '')
  const today = new Date()
  const currentWeek = weeks?.find(
    (w) => new Date(w.startDate) <= today && today <= new Date(w.endDate),
  )

  // Find today's day in this week
  const { data: days } = useDailyWorkouts(currentWeek?.id ?? '')
  const todayDay = days?.find((d) => isSameDay(new Date(d.date), today))

  if (profileLoading || plansLoading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
  }

  const progressPct = activePlan
    ? Math.round((activePlan.completedDays / activePlan.totalDays) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">
          {td.greeting}, {profile?.firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-muted">
          {format(today, 'EEEE, d MMMM yyyy', { locale: dateLocale })}
        </p>
      </div>

      {/* Stat cards */}
      <motion.div
        initial={shouldReduce ? false : 'hidden'}
        animate="visible"
        variants={staggerContainer}
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        <StatCard icon={<Flame size={20} className="text-warning" />}      label={td.streak} value={`${profile?.currentStreak ?? 0} ${tc.days}`} />
        <StatCard icon={<TrendingUp size={20} className="text-success" />}  label={td.weight} value={profile?.latestBodyweight ? `${profile.latestBodyweight} kg` : '—'} />
        <StatCard icon={<Calendar size={20} className="text-primary" />}   label="BMI"        value={profile?.bmi ? profile.bmi.toFixed(1) : '—'} sub={profile?.bmiCategory ?? undefined} />
        <StatCard icon={<Dumbbell size={20} className="text-muted" />}      label="DOTS"       value={profile?.dotsScore ? profile.dotsScore.toFixed(1) : '—'} />
      </motion.div>

      {/* Today's training */}
      {activePlan && (
        <motion.div variants={slideUp} initial={shouldReduce ? false : 'hidden'} animate="visible">
          <TodayTrainingCard
            todayDay={todayDay ?? null}
            weekId={currentWeek?.id}
            td={td}
            tc={tc}
            dateLocale={dateLocale}
          />
        </motion.div>
      )}

      {/* Active plan */}
      {activePlan ? (
        <Card className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{td.activePlanLabel}</p>
              <h2 className="mt-1 text-lg font-semibold text-text">{activePlan.name}</h2>
              <p className="text-sm text-muted">
                {format(new Date(activePlan.startDate), 'dd/MM/yyyy')} → {format(new Date(activePlan.endDate), 'dd/MM/yyyy')}
              </p>
            </div>
            <Badge variant="success">{tc.active}</Badge>
          </div>

          {/* Plan overall progress */}
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>{activePlan.completedDays} / {activePlan.totalDays} {tc.days}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--border-1)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-primary"
              />
            </div>
          </div>

          {/* This week's progress */}
          {currentWeek && currentWeek.totalDays > 0 && (() => {
            const weekPct  = Math.round((currentWeek.completedDays / currentWeek.totalDays) * 100)
            const weekDone = currentWeek.completedDays === currentWeek.totalDays
            return (
              <div
                className="rounded-lg px-3 py-2.5 space-y-1.5"
                style={{ background: 'var(--bg-3)', border: '1px solid var(--border-1)' }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted">{td.thisWeek}</span>
                  <span className="font-bold" style={{ color: weekDone ? 'var(--xn-success)' : 'var(--color-primary)' }}>
                    {currentWeek.completedDays}/{currentWeek.totalDays} {tc.days} · {weekPct}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--border-1)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${weekPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: weekDone ? 'var(--xn-success)' : 'var(--color-primary)' }}
                  />
                </div>
              </div>
            )
          })()}

          <Link to={`/plans/${activePlan.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {td.viewDetails} <ChevronRight size={14} />
          </Link>
        </Card>
      ) : (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <Dumbbell size={40} className="text-muted/40" />
          <p className="text-muted">{td.noActivePlan}</p>
          <Link to="/plans" className="text-sm font-medium text-primary hover:underline">{td.createPlanLink}</Link>
        </Card>
      )}
    </div>
  )
}

// ─── Today Training Card ──────────────────────────────────────────────────────

interface TodayDayShape {
  id: string
  dayOfWeek: string
  date: string
  totalExercises: number
  completedExercises: number
  isCompleted: boolean
  weeklyWorkoutId: string
}

interface TodayTrainingCardProps {
  todayDay: TodayDayShape | null
  weekId: string | undefined
  td: Record<string, string>
  tc: Record<string, string>
  dateLocale: Locale
}

function TodayTrainingCard({ todayDay, weekId, td, tc, dateLocale }: TodayTrainingCardProps) {
  const isRest = !todayDay || todayDay.totalExercises === 0

  if (isRest) {
    return (
      <Card className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'var(--bg-3)' }}
        >
          <Dumbbell size={22} className="text-muted" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{td.todayTraining}</p>
          <p className="mt-0.5 text-base font-semibold text-text">{td.restDay}</p>
        </div>
      </Card>
    )
  }

  const pct = Math.round((todayDay.completedExercises / todayDay.totalExercises) * 100)

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{td.todayTraining}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h2 className="text-lg font-semibold text-text">{todayDay.dayOfWeek}</h2>
            <span className="text-sm text-muted">
              {format(new Date(todayDay.date), 'd MMM', { locale: dateLocale })}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted">
            <span className="font-semibold text-text">{todayDay.totalExercises}</span>{' '}
            {td.exercisesPlanned}
            {todayDay.completedExercises > 0 && !todayDay.isCompleted && (
              <span className="ml-2">· {todayDay.completedExercises}/{todayDay.totalExercises} {tc.exercises}</span>
            )}
          </p>
        </div>

        {todayDay.isCompleted ? (
          <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium" style={{ background: 'var(--xn-sage-200)', color: 'var(--xn-success)' }}>
            <CheckCircle2 size={15} />
            {td.dayCompleted}
          </div>
        ) : (
          <Link
            to={`/days/${todayDay.id}`}
            state={{ canEdit: true, weeklyWorkoutId: todayDay.weeklyWorkoutId }}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent)', color: 'var(--fg-on-clay)' }}
          >
            {todayDay.completedExercises > 0 ? td.continueWorkout : td.startWorkout}
            <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {/* Progress bar */}
      {!todayDay.isCompleted && (
        <div>
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--border-1)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full bg-success"
            />
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps { icon: React.ReactNode; label: string; value: string; sub?: string }
function StatCard({ icon, label, value, sub }: StatCardProps) {
  return (
    <motion.div variants={slideUp} className={cn('rounded-xl border border-border bg-surface p-4')}>
      <div className="mb-2">{icon}</div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-bold text-text">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </motion.div>
  )
}
