import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Calendar,
  ClipboardList,
  Dumbbell,
  Sparkles,
  Target,
  Trash2,
  Utensils,
  Weight,
} from 'lucide-react'
import { format } from 'date-fns'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { cn } from '@/shared/utils/cn'
import { slideUp, softCardItem, staggerContainer } from '@/shared/utils/motion'
import { useLangStore, useT } from '@/shared/i18n'
import {
  useBodyweightHistory,
  useDeleteBodyweight,
  useLogBodyweight,
} from '@/features/profile'
import type {
  PersonalDashboardAction,
  PersonalDashboardInsight,
  PersonalDashboardNutrition,
  PersonalDashboardTodayWorkout,
} from '../types'
import { ActionIcon, Macro, PanelHeader, ProgressBar, SmallStat } from './dashboardWidgets'

type BodyweightForm = { weight: number }

const bodyweightSchema = z.object({
  weight: z.coerce.number().min(20, 'Weight must be at least 20 kg').max(500, 'Weight must be 500 kg or less'),
})

export function BodyweightPanel({ latestBodyweight }: { latestBodyweight: number | null }) {
  const { data: history = [] } = useBodyweightHistory()
  const { mutate: logWeight, isPending: logging } = useLogBodyweight()
  const { mutate: deleteWeight } = useDeleteBodyweight()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof bodyweightSchema>, unknown, BodyweightForm>({
    resolver: zodResolver(bodyweightSchema),
    defaultValues: { weight: latestBodyweight ?? undefined },
  })

  const chartData = [...history]
    .reverse()
    .slice(-14)
    .map((entry) => ({
      date: format(new Date(entry.date), 'dd/MM'),
      weight: entry.weight,
    }))

  function onSubmit(data: BodyweightForm) {
    logWeight(data, { onSuccess: () => reset({ weight: undefined }) })
  }

  return (
    <Card className="xn-dashboard-card space-y-4" variants={softCardItem}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <PanelHeader
          icon={<Weight size={18} />}
          label="Bodyweight"
          title={latestBodyweight ? `${latestBodyweight} kg` : 'Log your weight'}
          subtitle="Keep BMI, DOTS, and nutrition targets up to date."
          accent="#06b6d4"
        />
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div>
            <input
              type="number"
              step="0.1"
              placeholder="70.5"
              className={cn('xn-input h-10 w-full sm:w-28', errors.weight && 'error')}
              {...register('weight')}
            />
            {errors.weight?.message && (
              <p className="mt-1 text-xs" style={{ color: 'var(--xn-danger)' }}>
                {errors.weight.message}
              </p>
            )}
          </div>
          <Button type="submit" size="sm" loading={logging} className="h-10">
            Log today
          </Button>
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-48 min-w-0 rounded-xl border border-border bg-panel p-3">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--fg-3)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--fg-3)', fontSize: 11 }} domain={['auto', 'auto']} width={40} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 8 }}
                  formatter={(value) => [`${value} kg`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--xn-clay-700)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--xn-clay-700)', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              No bodyweight logs yet.
            </div>
          )}
        </div>

        <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-panel">
          {history.length > 0 ? (
            history.slice(0, 8).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-text">{entry.weight} kg</p>
                  <p className="text-xs text-muted">{format(new Date(entry.date), 'dd/MM/yyyy')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteWeight(entry.id)}
                  className="rounded-md p-1.5 text-danger transition hover:bg-danger/10"
                  aria-label="Delete bodyweight log"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          ) : (
            <p className="p-4 text-sm text-muted">Recent logs will appear here.</p>
          )}
        </div>
      </div>
    </Card>
  )
}

export function TodayPanel({ workout }: { workout: PersonalDashboardTodayWorkout | null }) {
  const td = useT().dashboard
  if (!workout) {
    return (
      <Card className="xn-dashboard-card space-y-4" variants={softCardItem}>
        <PanelHeader icon={<Calendar size={18} />} label={td.today} title={td.noWorkoutScheduled} accent="#f97316" />
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
    <Card className="xn-dashboard-card space-y-4" variants={softCardItem}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PanelHeader
          icon={<Dumbbell size={18} />}
          label={td.today}
          title={isRest ? td.restDay : workout.dayOfWeek}
          subtitle={format(new Date(workout.date), 'd MMM yyyy')}
          accent="#f97316"
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
          <Button size="sm" variant={workout.isCompleted ? 'secondary' : 'primary'} className="gap-1.5">
            {ctaLabel} <ArrowRight size={15} />
          </Button>
        </Link>
      )}
    </Card>
  )
}

export function PlanPanel({
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
      <Card className="xn-dashboard-card space-y-4" variants={softCardItem}>
        <PanelHeader icon={<ClipboardList size={18} />} label={td.activePlanLabel} title={td.noActivePlan} accent="#6366f1" />
        <p className="text-sm text-muted">{td.createPlanHint}</p>
        <Link to="/plans"><Button size="sm">{td.createPlan}</Button></Link>
      </Card>
    )
  }

  return (
    <Card className="xn-dashboard-card space-y-4" variants={softCardItem}>
      <div className="flex items-start justify-between gap-3">
        <PanelHeader
          icon={<ClipboardList size={18} />}
          label={td.activePlanLabel}
          title={plan.name}
          subtitle={`${format(new Date(plan.startDate), 'dd/MM/yyyy')} - ${format(new Date(plan.endDate), 'dd/MM/yyyy')}`}
          accent="#6366f1"
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

export function NutritionPanel({ nutrition }: { nutrition: PersonalDashboardNutrition }) {
  const td = useT().dashboard
  const hasTargets = nutrition.calorieTarget != null && nutrition.missingProfileFields.length === 0
  const caloriePct = nutrition.calorieTarget
    ? Math.min(100, Math.round((nutrition.loggedCalories / nutrition.calorieTarget) * 100))
    : 0

  return (
    <Card className="xn-dashboard-card space-y-4" variants={softCardItem}>
      <PanelHeader icon={<Utensils size={18} />} label={td.nutrition} title={td.todaysIntake} accent="#ec4899" />

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

export function NextActionsPanel({ actions }: { actions: PersonalDashboardAction[] }) {
  const td = useT().dashboard
  const lang = useLangStore((s) => s.lang)
  const shouldReduce = useReducedMotion()
  return (
    <Card className="xn-dashboard-card space-y-4" variants={softCardItem}>
      <PanelHeader icon={<Target size={18} />} label={td.nextActions} title={td.whatToDoNext} accent="#f59e0b" />
      <motion.div
        className="space-y-2"
        initial={shouldReduce ? false : 'hidden'}
        animate="visible"
        variants={shouldReduce ? undefined : staggerContainer}
      >
        {actions.map((action) => (
          <motion.div key={`${action.type}-${action.route}`} variants={shouldReduce ? undefined : slideUp}>
            <Link
              to={action.route}
              className="xn-choice-card group flex items-center gap-3 rounded-xl border border-border bg-panel p-3"
            >
              <div className="xn-choice-card-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-primary">
                <ActionIcon type={action.type} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-text group-hover:text-primary">{localizeAction(action.label, lang)}</p>
                <p className="text-sm text-muted">{localizeAction(action.description, lang)}</p>
              </div>
              <ArrowRight size={16} className="xn-choice-card-arrow shrink-0 text-muted" />
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </Card>
  )
}

function localizeAction(text: string, lang: 'en' | 'vi') {
  if (lang !== 'vi') return text
  const map: Record<string, string> = {
    'Create your first plan': 'Tạo plan đầu tiên',
    'Set up training so the hub can guide your day.': 'Thiết lập tập luyện để hub hướng dẫn ngày của bạn.',
    'Complete nutrition setup': 'Hoàn tất thiết lập dinh dưỡng',
    'Add missing profile data to unlock calorie and macro targets.': 'Bổ sung hồ sơ để mở khóa mục tiêu calo và macro.',
    'Log bodyweight': 'Ghi cân nặng',
    'Bodyweight improves BMI, DOTS, and nutrition calculations.': 'Cân nặng giúp cải thiện BMI, DOTS và tính toán dinh dưỡng.',
    'Review insights': 'Xem phân tích',
    'See training recommendations and trends.': 'Xem khuyến nghị tập luyện và xu hướng.',
  }
  return map[text] ?? text
}

export function ProInsightsPanel({
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
  const signals = insights.slice(0, 3)
  const destination = unlocked ? '/insights' : ctaRoute
  const buttonLabel = unlocked ? td.openAiInsights : ctaLabel ?? td.upgrade

  return (
    <Card
      className="xn-dashboard-card overflow-hidden"
      variants={softCardItem}
      style={{
        background: unlocked
          ? 'linear-gradient(135deg, color-mix(in oklch, var(--accent-soft) 50%, var(--bg-2) 50%), var(--bg-2))'
          : 'linear-gradient(135deg, color-mix(in oklch, var(--bg-2) 82%, var(--bg-3) 18%), var(--bg-2))',
        borderColor: 'var(--surface-border)',
      }}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)] lg:items-start">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <PanelHeader
              icon={<Sparkles size={18} />}
              label={td.proInsights}
              title={unlocked ? td.personalRecommendations : td.unlockDeeperGuidance}
              subtitle={unlocked ? td.proInsightsSubtitle : td.proFreeHint}
              accent="#8b5cf6"
            />
            <Badge variant={unlocked ? 'primary' : 'default'}>{td.proBadge}</Badge>
          </div>

          <p className="max-w-3xl text-sm leading-relaxed text-muted">
            {unlocked ? td.proAiPreviewBody : td.proLockedPreviewBody}
          </p>

          {destination && (
            <Link to={destination} className="inline-flex">
              <Button size="sm" className="gap-1.5">
                {buttonLabel} <ArrowRight size={15} />
              </Button>
            </Link>
          )}
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{td.proSignalLabel}</p>
            {unlocked && <p className="text-xs text-muted">{td.proPreviewNote}</p>}
          </div>

          {signals.length > 0 ? (
            <div className="divide-y" style={{ borderColor: 'var(--border-1)' }}>
              {signals.map((insight) => (
                <div key={`${insight.type}-${insight.title}`} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    className="mt-1 h-2.5 w-2.5 rounded-full"
                    style={{ background: signalColor(insight.severity) }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">{insight.type}</p>
                    <p className="mt-1 text-sm font-semibold leading-snug text-text">{insight.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-sm leading-relaxed text-muted">{td.proEmpty}</p>
          )}
        </div>
      </div>
    </Card>
  )
}

function signalColor(severity: string) {
  if (severity === 'Warning' || severity === 'Critical') return 'var(--xn-warning)'
  if (severity === 'Positive') return 'var(--xn-success)'
  return 'var(--accent)'
}
