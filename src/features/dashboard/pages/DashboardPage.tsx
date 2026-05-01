import React, { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router'
import { Flame, TrendingUp, Calendar, ChevronRight, Dumbbell, CheckCircle2 } from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import type { Locale } from 'date-fns'
import { vi as viLocale, enUS } from 'date-fns/locale'
import { Card } from '@/shared/components/Card'
import { Badge } from '@/shared/components/Badge'
import { Spinner } from '@/shared/components/Spinner'
import { Input } from '@/shared/components/Input'
import { cn } from '@/shared/utils/cn'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useT, useLangStore } from '@/shared/i18n'
import { useMyProfile } from '@/features/profile'
import { usePlans } from '@/features/plans'
import { useWeeklyWorkouts, useDailyWorkouts } from '@/features/workouts'

export function DashboardPage() {
  const shouldReduce = useReducedMotion()
  const [plateInput, setPlateInput] = useState<{ value: string; unit: 'kg' | 'lbs' }>({
    value: '100',
    unit: 'kg',
  })
  const { data: profile, isLoading: profileLoading } = useMyProfile()
  const { data: plans, isLoading: plansLoading } = usePlans()
  const t   = useT()
  const td  = t.dashboard
  const tc  = t.common
  const lang = useLangStore((s) => s.lang)
  const dateLocale = lang === 'vi' ? viLocale : enUS

  const activePlan = plans?.find((p) => p.isActive)
  const plateCalculator = useMemo(
    () => getPlateCalculator(Number(plateInput.value), plateInput.unit),
    [plateInput],
  )

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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: stats + plate calculator */}
        <div className="space-y-6">
          <motion.div
            initial={shouldReduce ? false : 'hidden'}
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-2 gap-3"
          >
            <StatCard icon={<Flame size={20} className="text-warning" />}     iconBg="var(--xn-warning-bg)" label={td.streak} value={`${profile?.currentStreak ?? 0} ${tc.days}`} />
            <StatCard icon={<TrendingUp size={20} className="text-success" />} iconBg="var(--xn-success-bg)" label={td.weight} value={profile?.latestBodyweight ? `${profile.latestBodyweight} kg` : '—'} />
            <StatCard icon={<Calendar size={20} className="text-primary" />}  iconBg="var(--xn-clay-100)"   label="BMI"        value={profile?.bmi ? profile.bmi.toFixed(1) : '—'} sub={profile?.bmiCategory ?? undefined} />
            <StatCard icon={<Dumbbell size={20} className="text-muted" />}     iconBg="var(--xn-ink-100)"    label="DOTS"       value={profile?.dotsScore ? profile.dotsScore.toFixed(1) : '—'} />
          </motion.div>

          <PlateCalculatorCard
            input={plateInput}
            onInputChange={setPlateInput}
            calculator={plateCalculator}
          />
        </div>

        {/* Right column: today's training + active plan */}
        <div className="space-y-6">
          {activePlan && (
            <motion.div variants={slideUp} initial={shouldReduce ? false : 'hidden'} animate="visible">
              <TodayTrainingCard
                todayDay={todayDay ?? null}
                td={td}
                tc={tc}
                dateLocale={dateLocale}
              />
            </motion.div>
          )}

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
      </div>
    </div>
  )
}

// ─── Today Training Card ──────────────────────────────────────────────────────

interface PlateCalculatorResult {
  kg: number | null
  lbs: number | null
  kgLoad: PlateLoadResult | null
  lbsLoad: PlateLoadResult | null
}

interface PlateLoadResult {
  totalLoadedWeight: number
  plates: Array<{ weight: number; count: number }>
  remainder: number
}

const KG_TO_LBS = 2.2046226218
const BAR_KG = 20
const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]
const LB_PLATES = [55, 45, 35, 25, 10, 5, 2.5]

function getPlateCalculator(value: number, unit: 'kg' | 'lbs'): PlateCalculatorResult {
  if (!Number.isFinite(value) || value <= 0) {
    return { kg: null, lbs: null, kgLoad: null, lbsLoad: null }
  }

  const kg = unit === 'kg' ? value : value / KG_TO_LBS
  const lbs = unit === 'lbs' ? value : value * KG_TO_LBS

  return {
    kg,
    lbs,
    kgLoad: getPlateLoad(kg, BAR_KG, KG_PLATES),
    lbsLoad: getPlateLoad(lbs, BAR_KG * KG_TO_LBS, LB_PLATES),
  }
}

function getPlateLoad(totalWeight: number, barWeight: number, plates: number[]): PlateLoadResult | null {
  if (totalWeight < barWeight) return null

  let remainingPerSide = (totalWeight - barWeight) / 2
  const loadedPlates: Array<{ weight: number; count: number }> = []

  for (const plate of plates) {
    const count = Math.floor((remainingPerSide + 0.0001) / plate)
    if (count > 0) {
      loadedPlates.push({ weight: plate, count })
      remainingPerSide -= count * plate
    }
  }

  const loadedPerSide = loadedPlates.reduce((sum, plate) => sum + plate.weight * plate.count, 0)

  return {
    totalLoadedWeight: barWeight + loadedPerSide * 2,
    plates: loadedPlates,
    remainder: Math.max(0, remainingPerSide),
  }
}

function PlateCalculatorCard({
  input,
  onInputChange,
  calculator,
}: {
  input: { value: string; unit: 'kg' | 'lbs' }
  onInputChange: (input: { value: string; unit: 'kg' | 'lbs' }) => void
  calculator: PlateCalculatorResult
}) {
  const kgValue = input.unit === 'kg' ? input.value : calculator.kg ? roundDisplay(calculator.kg) : ''
  const lbsValue = input.unit === 'lbs' ? input.value : calculator.lbs ? roundDisplay(calculator.lbs) : ''

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text">Plate Calculator</h2>
        <p className="mt-1 text-sm text-muted">20kg bar by default. Plate counts are shown per side.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Kilograms"
          type="number"
          min="0"
          step="0.5"
          value={kgValue}
          onChange={(event) => onInputChange({ value: event.target.value, unit: 'kg' })}
        />
        <Input
          label="Pounds"
          type="number"
          min="0"
          step="1"
          value={lbsValue}
          onChange={(event) => onInputChange({ value: event.target.value, unit: 'lbs' })}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <PlateLoadPanel title="KG plates" unit="kg" barLabel="20kg bar" load={calculator.kgLoad} />
        <PlateLoadPanel title="LB plates" unit="lb" barLabel={`${roundDisplay(BAR_KG * KG_TO_LBS)}lb bar`} load={calculator.lbsLoad} />
      </div>
    </Card>
  )
}

function PlateLoadPanel({
  title,
  unit,
  barLabel,
  load,
}: {
  title: string
  unit: string
  barLabel: string
  load: PlateLoadResult | null
}) {
  return (
    <div className="rounded-xl border border-border bg-panel p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">{title}</p>
          <p className="text-xs text-muted">{barLabel}</p>
        </div>
        {load && (
          <p className="text-sm font-semibold text-text">
            {roundDisplay(load.totalLoadedWeight)} {unit}
          </p>
        )}
      </div>

      {!load ? (
        <p className="text-sm text-muted">Enter a weight at or above the bar weight.</p>
      ) : load.plates.length === 0 ? (
        <p className="text-sm text-muted">Bar only.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {load.plates.map((plate) => (
            <span
              key={`${unit}-${plate.weight}`}
              className="rounded-full px-3 py-1 text-sm font-medium"
              style={{ background: 'var(--bg-3)', color: 'var(--fg-1)' }}
            >
              {plate.count}x {plate.weight}{unit}
            </span>
          ))}
        </div>
      )}

      {load && load.remainder > 0.01 && (
        <p className="mt-3 text-xs text-muted">
          Nearest load. Remaining per side: {roundDisplay(load.remainder)} {unit}.
        </p>
      )}
    </div>
  )
}

function roundDisplay(value: number) {
  return Number(value.toFixed(2)).toString()
}

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
  td: Record<string, string>
  tc: Record<string, string>
  dateLocale: Locale
}

function TodayTrainingCard({ todayDay, td, tc, dateLocale }: TodayTrainingCardProps) {
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{td.todayTraining}</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
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
          <div className="flex flex-shrink-0 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium" style={{ background: 'var(--xn-sage-200)', color: 'var(--xn-success)' }}>
            <CheckCircle2 size={15} />
            {td.dayCompleted}
          </div>
        ) : (
          <Link
            to={`/days/${todayDay.id}`}
            state={{ canEdit: true, weeklyWorkoutId: todayDay.weeklyWorkoutId }}
            className="flex w-full flex-shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80 sm:w-auto sm:py-1.5"
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

interface StatCardProps { icon: React.ReactNode; label: string; value: string; sub?: string; iconBg?: string }
function StatCard({ icon, label, value, sub, iconBg }: StatCardProps) {
  return (
    <motion.div variants={slideUp} className={cn('rounded-xl border border-border bg-surface p-4')}>
      <div
        className="mb-3 w-fit rounded-lg p-2"
        style={{ background: iconBg ?? 'var(--xn-clay-100)' }}
      >
        {icon}
      </div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-bold text-text">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </motion.div>
  )
}
