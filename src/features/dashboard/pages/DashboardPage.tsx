import React, { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  Calculator,
  Calendar,
  ClipboardList,
  Dumbbell,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  Utensils,
  Weight,
} from 'lucide-react'
import { format } from 'date-fns'
import { enUS, vi as viLocale } from 'date-fns/locale'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Input } from '@/shared/components/Input'
import { Modal } from '@/shared/components/Modal'
import { Spinner } from '@/shared/components/Spinner'
import { cn } from '@/shared/utils/cn'
import { slideUp, staggerContainer } from '@/shared/utils/motion'
import { useLangStore, useT } from '@/shared/i18n'
import { DailyTipCard } from '@/features/tips'
import { usePersonalDashboard } from '../api/usePersonalDashboard'
import type {
  PersonalDashboardAction,
  PersonalDashboardInsight,
  PersonalDashboardNutrition,
  PersonalDashboardTodayWorkout,
} from '../types'

export function DashboardPage() {
  const shouldReduce = useReducedMotion()
  const lang = useLangStore((s) => s.lang)
  const td = useT().dashboard
  const dateLocale = lang === 'vi' ? viLocale : enUS
  const { data, isLoading, isError } = usePersonalDashboard()
  const [plateCalcOpen, setPlateCalcOpen] = useState(false)
  const [plateInput, setPlateInput] = useState<{ value: string; unit: 'kg' | 'lbs' }>({
    value: '100',
    unit: 'kg',
  })
  const plateCalculator = useMemo(
    () => getPlateCalculator(Number(plateInput.value), plateInput.unit),
    [plateInput],
  )

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
  }

  if (isError || !data) {
    return (
      <Card>
        <p className="py-10 text-center text-sm text-muted">{td.loadError}</p>
      </Card>
    )
  }

  const today = new Date()
  const profile = data.profile
  const xpAtLevelStart = (profile.level * (profile.level - 1)) / 2 * 1000
  const xpIntoLevel = Math.max(0, profile.totalXp - xpAtLevelStart)
  const xpPct = profile.xpToNextLevel > 0
    ? Math.min(100, Math.round((xpIntoLevel / profile.xpToNextLevel) * 100))
    : 0

  return (
    <div className="space-y-6">
      <section
        className="overflow-hidden rounded-2xl border border-border bg-surface p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, var(--bg-2), var(--bg-1))' }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted">
              {format(today, 'EEEE, d MMMM yyyy', { locale: dateLocale })}
            </p>
            <div className="mt-2 flex min-w-0 items-center gap-2">
              <h1 className="text-2xl font-bold text-text sm:text-3xl">
                {td.welcomeBack.replace('{name}', profile.firstName || td.fallbackName)}
              </h1>
              <DailyTipCard />
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              {td.dailyCommand}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/insights">
              <Button size="sm" className="gap-1.5">
                <Sparkles size={15} /> {td.aiInsights}
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPlateCalcOpen(true)}
              className="gap-1.5"
            >
              <Calculator size={15} /> {td.plateCalculatorTitle}
            </Button>
          </div>
        </div>

        <motion.div
          initial={shouldReduce ? false : 'hidden'}
          animate="visible"
          variants={staggerContainer}
          className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <MetricCard icon={<Flame size={18} />} label={td.streak} value={td.streakValue.replace('{n}', String(profile.currentStreak))} />
          <MetricCard icon={<TrendingUp size={18} />} label={td.bodyweight} value={profile.latestBodyweight ? `${profile.latestBodyweight} kg` : '-'} />
          <MetricCard icon={<Activity size={18} />} label="BMI" value={profile.bmi ? profile.bmi.toFixed(1) : '-'} sub={profile.bmiCategory ?? undefined} />
          <MetricCard icon={<Dumbbell size={18} />} label="DOTS" value={profile.dotsScore ? profile.dotsScore.toFixed(1) : '-'} />
        </motion.div>

        <div className="mt-5 rounded-xl border border-border bg-panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{td.level.replace('{n}', String(profile.level))}</p>
              <p className="text-base font-bold text-text">{profile.title}</p>
            </div>
            <p className="text-sm font-semibold text-text">
              {xpIntoLevel.toLocaleString()} / {profile.xpToNextLevel.toLocaleString()} XP
            </p>
          </div>
          <ProgressBar value={xpPct} className="mt-3" />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <TodayPanel workout={data.todayWorkout} />
        <PlanPanel plan={data.activePlan} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <NutritionPanel nutrition={data.nutritionToday} />
        <NextActionsPanel actions={data.nextActions} />
      </div>

      <ProInsightsPanel
        unlocked={data.proInsights.isUnlocked}
        ctaLabel={data.proInsights.ctaLabel}
        ctaRoute={data.proInsights.ctaRoute}
        insights={data.proInsights.items}
      />

      <Modal
        open={plateCalcOpen}
        onClose={() => setPlateCalcOpen(false)}
        title={td.plateCalculatorTitle}
        className="max-w-2xl"
      >
        <PlateCalculatorBody
          input={plateInput}
          onInputChange={setPlateInput}
          calculator={plateCalculator}
        />
      </Modal>
    </div>
  )
}

function TodayPanel({ workout }: { workout: PersonalDashboardTodayWorkout | null }) {
  const td = useT().dashboard
  if (!workout) {
    return (
      <Card className="space-y-4">
        <PanelHeader icon={<Calendar size={18} />} label={td.today} title={td.noWorkoutScheduled} />
        <p className="text-sm text-muted">{td.noWorkoutHint}</p>
        <Link to="/plans">
          <Button size="sm" variant="secondary">{td.openPlans}</Button>
        </Link>
      </Card>
    )
  }

  const isRest = workout.status === 'Rest' || workout.totalExercises === 0
  const setPct = workout.totalSets > 0 ? Math.round((workout.completedSets / workout.totalSets) * 100) : 0
  const ctaLabel = workout.isCompleted ? td.workoutComplete : workout.completedSets > 0 ? td.continueWorkout : td.startWorkout

  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PanelHeader
          icon={<Dumbbell size={18} />}
          label={td.today}
          title={isRest ? td.restDay : workout.dayOfWeek}
          subtitle={format(new Date(workout.date), 'd MMM yyyy')}
        />
        {workout.isCompleted && <Badge variant="success">{td.done}</Badge>}
        {isRest && <Badge variant="default">{td.rest}</Badge>}
      </div>

      {isRest ? (
        <p className="text-sm text-muted">{td.noExercisesToday}</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <SmallStat label={td.exercises} value={`${workout.completedExercises}/${workout.totalExercises}`} />
            <SmallStat label={td.sets} value={`${workout.completedSets}/${workout.totalSets}`} />
            <SmallStat label={td.volume} value={workout.plannedVolume > 0 ? `${Math.round(workout.plannedVolume).toLocaleString()} kg` : '-'} />
          </div>
          <ProgressBar value={setPct} />
          {workout.muscleGroups.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {workout.muscleGroups.map((group) => <Badge key={group} variant="default">{group}</Badge>)}
            </div>
          )}
        </>
      )}

      {!isRest && (
        <Link
          to={workout.route}
          state={{ canEdit: true, canComplete: true, weeklyWorkoutId: workout.weeklyWorkoutId }}
        >
          <Button size="sm" disabled={workout.isCompleted} className="gap-1.5">
            {ctaLabel} <ArrowRight size={15} />
          </Button>
        </Link>
      )}
    </Card>
  )
}

function PlanPanel({
  plan,
}: {
  plan: {
    id: string
    name: string
    startDate: string
    endDate: string
    totalDays: number
    completedDays: number
    progressPercent: number
    currentWeek: {
      name: string
      totalDays: number
      completedDays: number
      progressPercent: number
    } | null
  } | null
}) {
  const t = useT()
  const td = t.dashboard
  const tc = t.common
  if (!plan) {
    return (
      <Card className="space-y-4">
        <PanelHeader icon={<ClipboardList size={18} />} label={td.activePlanLabel} title={td.noActivePlan} />
        <p className="text-sm text-muted">{td.createPlanHint}</p>
        <Link to="/plans"><Button size="sm">{td.createPlan}</Button></Link>
      </Card>
    )
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <PanelHeader
          icon={<ClipboardList size={18} />}
          label={td.activePlanLabel}
          title={plan.name}
          subtitle={`${format(new Date(plan.startDate), 'dd/MM/yyyy')} - ${format(new Date(plan.endDate), 'dd/MM/yyyy')}`}
        />
        <Badge variant="success">{tc.active}</Badge>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>{plan.completedDays}/{plan.totalDays} {tc.days}</span>
          <span>{plan.progressPercent}%</span>
        </div>
        <ProgressBar value={plan.progressPercent} />
      </div>

      {plan.currentWeek && (
        <div className="rounded-xl border border-border bg-panel p-3">
          <div className="flex justify-between gap-3 text-sm">
            <span className="font-medium text-text">{plan.currentWeek.name}</span>
            <span className="text-muted">{plan.currentWeek.completedDays}/{plan.currentWeek.totalDays} {tc.days}</span>
          </div>
          <ProgressBar value={plan.currentWeek.progressPercent} className="mt-2" />
        </div>
      )}

      <Link to={`/plans/${plan.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        {td.viewPlan} <ArrowRight size={14} />
      </Link>
    </Card>
  )
}

function NutritionPanel({ nutrition }: { nutrition: PersonalDashboardNutrition }) {
  const td = useT().dashboard
  const hasTargets = nutrition.calorieTarget != null && nutrition.missingProfileFields.length === 0
  const caloriePct = nutrition.calorieTarget
    ? Math.min(100, Math.round((nutrition.loggedCalories / nutrition.calorieTarget) * 100))
    : 0

  return (
    <Card className="space-y-4">
      <PanelHeader icon={<Utensils size={18} />} label={td.nutrition} title={td.todaysIntake} />

      {!hasTargets ? (
        <div className="rounded-xl border border-warning/30 p-4" style={{ background: 'var(--xn-warning-bg)' }}>
          <p className="font-semibold text-text">{td.nutritionIncomplete}</p>
          <p className="mt-1 text-sm text-muted">
            {td.missing}: {nutrition.missingProfileFields.length > 0 ? nutrition.missingProfileFields.join(', ') : td.profileData}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-3xl font-bold text-text">{nutrition.loggedCalories}</p>
              <p className="text-sm text-muted">{td.ofCalories.replace('{n}', String(nutrition.calorieTarget))}</p>
            </div>
            <p className="text-sm font-semibold text-text">
              {nutrition.remainingCalories != null ? td.kcalLeft.replace('{n}', String(nutrition.remainingCalories)) : '-'}
            </p>
          </div>
          <ProgressBar value={caloriePct} />
          <div className="grid gap-2 sm:grid-cols-3">
            <Macro label={td.protein} logged={nutrition.loggedProteinG} target={nutrition.proteinTargetG} />
            <Macro label={td.carbs} logged={nutrition.loggedCarbsG} target={nutrition.carbsTargetG} />
            <Macro label={td.fat} logged={nutrition.loggedFatG} target={nutrition.fatTargetG} />
          </div>
        </>
      )}

      <Link to="/nutrition"><Button size="sm" variant="secondary">{td.openNutrition}</Button></Link>
    </Card>
  )
}

function NextActionsPanel({ actions }: { actions: PersonalDashboardAction[] }) {
  const td = useT().dashboard
  return (
    <Card className="space-y-4">
      <PanelHeader icon={<Target size={18} />} label={td.nextActions} title={td.whatToDoNext} />
      <div className="space-y-2">
        {actions.map((action) => (
          <Link
            key={`${action.type}-${action.route}`}
            to={action.route}
            className="group flex items-center gap-3 rounded-xl border border-border bg-panel p-3 transition-colors hover:border-primary/40"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-primary">
              <ActionIcon type={action.type} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text group-hover:text-primary">{action.label}</p>
              <p className="text-sm text-muted">{action.description}</p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-muted" />
          </Link>
        ))}
      </div>
    </Card>
  )
}

function ProInsightsPanel({
  unlocked,
  ctaLabel,
  ctaRoute,
  insights,
}: {
  unlocked: boolean
  ctaLabel: string | null
  ctaRoute: string | null
  insights: PersonalDashboardInsight[]
}) {
  const td = useT().dashboard
  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PanelHeader icon={<Sparkles size={18} />} label={td.proInsights} title={unlocked ? td.personalRecommendations : td.unlockDeeperGuidance} />
        {!unlocked && ctaRoute && (
          <Link to={ctaRoute}><Button size="sm">{ctaLabel ?? td.upgrade}</Button></Link>
        )}
      </div>

      {!unlocked ? (
        <p className="text-sm text-muted">
          {td.proFreeHint}
        </p>
      ) : insights.length === 0 ? (
        <p className="text-sm text-muted">{td.proEmpty}</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          {insights.map((insight) => (
            <div
              key={`${insight.type}-${insight.title}`}
              className="rounded-xl border p-4"
              style={insightStyle(insight.severity)}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{insight.type}</p>
              <p className="mt-2 font-semibold text-text">{insight.title}</p>
              <p className="mt-1 text-sm text-muted">{insight.message}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <motion.div variants={slideUp} className="rounded-xl border border-border bg-panel p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-primary">{icon}</div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-bold text-text">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </motion.div>
  )
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-panel p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-semibold text-text">{value}</p>
    </div>
  )
}

function Macro({ label, logged, target }: { label: string; logged: number; target: number | null }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-semibold text-text">{Math.round(logged)} / {target == null ? '-' : Math.round(target)}g</p>
    </div>
  )
}

function PanelHeader({
  icon,
  label,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  label: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-panel text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <h2 className="mt-0.5 break-words text-lg font-semibold text-text">{title}</h2>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
    </div>
  )
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full', className)} style={{ background: 'var(--border-1)' }}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

function ActionIcon({ type }: { type: string }) {
  if (type.includes('Workout')) return <Dumbbell size={17} />
  if (type.includes('Nutrition')) return <Utensils size={17} />
  if (type.includes('Bodyweight')) return <Weight size={17} />
  if (type.includes('Profile')) return <Activity size={17} />
  if (type.includes('Plan')) return <ClipboardList size={17} />
  return <Sparkles size={17} />
}

function insightStyle(severity: string): React.CSSProperties {
  if (severity === 'Warning' || severity === 'Critical') {
    return { borderColor: 'rgba(245,158,11,0.28)', background: 'rgba(245,158,11,0.08)' }
  }
  if (severity === 'Positive') {
    return { borderColor: 'rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.08)' }
  }
  return { borderColor: 'var(--border-1)', background: 'var(--bg-2)' }
}

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

function PlateCalculatorBody({
  input,
  onInputChange,
  calculator,
}: {
  input: { value: string; unit: 'kg' | 'lbs' }
  onInputChange: (input: { value: string; unit: 'kg' | 'lbs' }) => void
  calculator: PlateCalculatorResult
}) {
  const td = useT().dashboard
  const kgValue = input.unit === 'kg' ? input.value : calculator.kg ? roundDisplay(calculator.kg) : ''
  const lbsValue = input.unit === 'lbs' ? input.value : calculator.lbs ? roundDisplay(calculator.lbs) : ''

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{td.plateCalculatorHint}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={td.kilograms}
          type="number"
          min="0"
          step="0.5"
          value={kgValue}
          onChange={(event) => onInputChange({ value: event.target.value, unit: 'kg' })}
        />
        <Input
          label={td.pounds}
          type="number"
          min="0"
          step="1"
          value={lbsValue}
          onChange={(event) => onInputChange({ value: event.target.value, unit: 'lbs' })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PlateLoadPanel title={td.kgPlates} unit="kg" barLabel={td.kgBar} load={calculator.kgLoad} />
        <PlateLoadPanel title={td.lbPlates} unit="lb" barLabel={td.lbBar.replace('{n}', roundDisplay(BAR_KG * KG_TO_LBS))} load={calculator.lbsLoad} />
      </div>
    </div>
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
  const td = useT().dashboard
  return (
    <div className="rounded-xl border border-border bg-panel p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">{title}</p>
          <p className="text-xs text-muted">{barLabel}</p>
        </div>
        {load && <p className="text-sm font-semibold text-text">{roundDisplay(load.totalLoadedWeight)} {unit}</p>}
      </div>

      {!load ? (
        <p className="text-sm text-muted">{td.enterAboveBar}</p>
      ) : load.plates.length === 0 ? (
        <p className="text-sm text-muted">{td.barOnly}</p>
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
          {td.nearestLoad.replace('{n}', roundDisplay(load.remainder)).replace('{unit}', unit)}
        </p>
      )}
    </div>
  )
}

function roundDisplay(value: number) {
  return Number(value.toFixed(2)).toString()
}
