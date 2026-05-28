import { useEffect, useState } from 'react'
import type React from 'react'
import { Link, useParams } from 'react-router'
import { format, subDays } from 'date-fns'
import { Activity, ChevronLeft, Flame, LineChart as LineChartIcon, Scale, Sparkles, Target, TrendingUp, Utensils } from 'lucide-react'
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import { useT } from '@/shared/i18n'
import { RequireTier } from '@/features/billing/components/RequireTier'
import {
  useNutritionHistory,
  useNutritionSummary,
  useUpdateNutritionProfile,
} from '../api/useNutrition'
import { useDayFoodLogs } from '../api/useFoodLog'
import { FoodLogPanel } from '../components/FoodLog/FoodLogPanel'
import { NutritionHistoryCards } from '../components/NutritionHistoryCards'
import type {
  ActivityLevel,
  NutritionGoal,
  NutritionSummaryResponse,
  UpdateNutritionProfileRequest,
} from '../types'

export function NutritionPage() {
  const t = useT()
  const tn = t.nutrition
  const { clientId } = useParams()
  const isClientView = Boolean(clientId)
  const { data: summary, isLoading } = useNutritionSummary(clientId)
  const updateProfile = useUpdateNutritionProfile(clientId)
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const { data: todayFoodData } = useDayFoodLogs(todayStr, !isClientView)

  const activityOptions: { value: ActivityLevel; label: string }[] = [
    { value: 'Sedentary', label: tn.activitySedentary },
    { value: 'Light', label: tn.activityLight },
    { value: 'Moderate', label: tn.activityModerate },
    { value: 'VeryActive', label: tn.activityVeryActive },
    { value: 'Athlete', label: tn.activityAthlete },
  ]

  const goalOptions: { value: NutritionGoal; label: string }[] = [
    { value: 'Cut', label: tn.goalCut },
    { value: 'Maintain', label: tn.goalMaintain },
    { value: 'Bulk', label: tn.goalBulk },
  ]

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    activityLevel: 'Moderate',
    goal: 'Maintain',
    targetWeightKg: '',
    customCalorieTarget: '',
    proteinPerKg: '',
    fatPerKg: '',
  })
  const [logForm, setLogForm] = useState<LogForm>({
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
    notes: '',
  })
  const [showNutritionInsight, setShowNutritionInsight] = useState(false)

  useEffect(() => {
    if (!summary) return
    setProfileForm({
      activityLevel: summary.profile.activityLevel,
      goal: summary.profile.goal,
      targetWeightKg: toField(summary.profile.targetWeightKg),
      customCalorieTarget: toField(summary.profile.customCalorieTarget),
      proteinPerKg: toField(summary.profile.proteinPerKg),
      fatPerKg: toField(summary.profile.fatPerKg),
    })
    setLogForm({
      calories: toField(summary.todayLog?.calories),
      proteinG: toField(summary.todayLog?.proteinG),
      carbsG: toField(summary.todayLog?.carbsG),
      fatG: toField(summary.todayLog?.fatG),
      notes: summary.todayLog?.notes ?? '',
    })
  }, [summary])

  function saveProfile() {
    const payload: UpdateNutritionProfileRequest = {
      activityLevel: profileForm.activityLevel,
      goal: profileForm.goal,
      targetWeightKg: optionalNumber(profileForm.targetWeightKg),
      customCalorieTarget: optionalNumber(profileForm.customCalorieTarget),
      proteinPerKg: optionalNumber(profileForm.proteinPerKg),
      fatPerKg: optionalNumber(profileForm.fatPerKg),
    }
    updateProfile.mutate(payload)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!summary) return <p className="text-muted">{tn.notAvailable}</p>

  const calc = summary.calculation
  const hasCalculation = calc.missingFields.length === 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {isClientView && (
            <Link to={`/coach/clients/${clientId}`} className="mb-2 inline-flex">
              <Button variant="ghost" size="sm"><ChevronLeft size={16} /> {tn.backToClient}</Button>
            </Link>
          )}
          <h1 className="text-2xl font-bold text-text">{isClientView ? tn.clientTitle : tn.title}</h1>
          <p className="mt-1 text-sm text-muted">{tn.subtitle}</p>
        </div>
        <Button
          variant={showNutritionInsight ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowNutritionInsight((value) => !value)}
          className="shrink-0 whitespace-nowrap"
        >
          <Sparkles size={16} /> {tn.nutritionInsight}
        </Button>
      </div>

      {!hasCalculation && (
        <Card className="border-warning/30" style={{ background: 'var(--xn-warning-bg)' }}>
          <div className="flex items-start gap-3">
            <Flame size={20} style={{ color: 'var(--xn-warning)' }} />
            <div>
              <h2 className="font-semibold text-text">{tn.missingProfileTitle}</h2>
              <p className="mt-1 text-sm text-muted">
                {tn.missingProfileBody.replace(
                  '{fields}',
                  calc.missingFields.map((f) => formatMissingField(f, tn.missingFieldDateOfBirth)).join(', '),
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Activity size={18} />} label={tn.bmrLabel} value={formatKcal(calc.bmr, tn.kcal, tn.missing)} />
        <MetricCard icon={<Flame size={18} />} label={tn.tdeeLabel} value={formatKcal(calc.tdee, tn.kcal, tn.missing)} />
        <MetricCard icon={<Target size={18} />} label={tn.targetLabel} value={formatKcal(calc.calorieTarget, tn.kcal, tn.missing)} />
        <MetricCard
          icon={<Utensils size={18} />}
          label={tn.bodyweightLabel}
          value={calc.bodyweightKg ? `${calc.bodyweightKg} ${tn.kg}` : tn.missing}
        />
      </div>

      {hasCalculation && (
        <NutritionValueDiagrams
          summary={summary}
          caloriesActual={!isClientView && todayFoodData ? todayFoodData.totals.totalCalories : readNumber(logForm.calories)}
          proteinActual={!isClientView && todayFoodData ? todayFoodData.totals.totalProteinG : readNumber(logForm.proteinG)}
          carbsActual={!isClientView && todayFoodData ? todayFoodData.totals.totalCarbsG : readNumber(logForm.carbsG)}
          fatActual={!isClientView && todayFoodData ? todayFoodData.totals.totalFatG : readNumber(logForm.fatG)}
          tn={tn}
        />
      )}

      {showNutritionInsight && (
        <RequireTier feature={tn.nutritionInsight}>
          <NutritionInsightPanel
            clientId={clientId}
            enabled={summary.canUseAdvancedAnalysis}
            summary={summary}
            logForm={logForm}
          />
        </RequireTier>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <Target size={17} className="text-primary" />
            <h2 className="text-lg font-semibold text-text">{tn.profileSectionTitle}</h2>
          </div>

          {/* ── Basics row ─────────────────────────────────────────────── */}
          <section className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--fg-3)' }}>
              {tn.basicsSection}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label={tn.goalLabel}
                value={profileForm.goal}
                options={goalOptions}
                onChange={(value) => setProfileForm((f) => ({ ...f, goal: value as NutritionGoal }))}
              />
              <Select
                label={tn.activityLabel}
                value={profileForm.activityLevel}
                options={activityOptions}
                onChange={(value) => setProfileForm((f) => ({ ...f, activityLevel: value as ActivityLevel }))}
              />
              <Input
                className="md:col-span-2"
                label={tn.targetWeightLabel}
                type="number"
                min="20"
                step="0.1"
                value={profileForm.targetWeightKg}
                onChange={(e) => setProfileForm((f) => ({ ...f, targetWeightKg: e.target.value }))}
              />
            </div>
          </section>

          {/* ── Fine tuning row ────────────────────────────────────────── */}
          <section
            className="mt-6 space-y-3 border-t pt-6"
            style={{ borderColor: 'var(--border-1)' }}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--fg-3)' }}>
                {tn.fineTuningSection}
              </p>
              <p className="text-xs text-muted">{tn.fineTuningHint}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label={tn.customCaloriesLabel}
                type="number"
                min="800"
                placeholder={
                  calc.calorieTarget
                    ? `${tn.autoPrefix}${calc.calorieTarget} ${tn.kcal}`
                    : tn.autoPlaceholder
                }
                value={profileForm.customCalorieTarget}
                onChange={(e) => setProfileForm((f) => ({ ...f, customCalorieTarget: e.target.value }))}
              />
              <Input
                label={tn.proteinPerKgLabel}
                type="number"
                min="0.5"
                step="0.1"
                placeholder={tn.autoPlaceholder}
                value={profileForm.proteinPerKg}
                onChange={(e) => setProfileForm((f) => ({ ...f, proteinPerKg: e.target.value }))}
              />
              <Input
                className="md:col-span-2"
                label={tn.fatPerKgLabel}
                type="number"
                min="0.2"
                step="0.1"
                placeholder={tn.autoPlaceholder}
                value={profileForm.fatPerKg}
                onChange={(e) => setProfileForm((f) => ({ ...f, fatPerKg: e.target.value }))}
              />
            </div>
          </section>

          <div className="mt-6 flex justify-end">
            <Button onClick={saveProfile} loading={updateProfile.isPending}>{tn.saveProfile}</Button>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Utensils size={17} className="text-primary" />
            <h2 className="text-lg font-semibold text-text">{tn.todayIntakeTitle}</h2>
          </div>
          {isClientView ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg p-3" style={{ background: 'var(--surface-2, var(--surface))' }}>
                <p className="text-xs" style={{ color: 'var(--fg-3)' }}>{tn.caloriesLabel}</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--fg-1)' }}>{readNumber(logForm.calories)} kcal</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--surface-2, var(--surface))' }}>
                <p className="text-xs" style={{ color: 'var(--fg-3)' }}>{tn.proteinLabel}</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--fg-1)' }}>{readNumber(logForm.proteinG)}g</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--surface-2, var(--surface))' }}>
                <p className="text-xs" style={{ color: 'var(--fg-3)' }}>{tn.carbsLabel}</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--fg-1)' }}>{readNumber(logForm.carbsG)}g</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--surface-2, var(--surface))' }}>
                <p className="text-xs" style={{ color: 'var(--fg-3)' }}>{tn.fatLabel}</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--fg-1)' }}>{readNumber(logForm.fatG)}g</p>
              </div>
            </div>
          ) : (
            <FoodLogPanel />
          )}
        </Card>
      </div>

      <RequireTier feature={tn.requireFeature}>
        <NutritionHistoryPanel clientId={clientId} enabled={summary.canUseAdvancedAnalysis} calorieTarget={calc.calorieTarget} />
      </RequireTier>
    </div>
  )
}

function NutritionHistoryPanel({
  clientId,
  enabled,
  calorieTarget,
}: {
  clientId?: string
  enabled: boolean
  calorieTarget: number | null
}) {
  const t = useT()
  const tn = t.nutrition
  const to = format(new Date(), 'yyyy-MM-dd')
  const from = format(subDays(new Date(), 29), 'yyyy-MM-dd')
  const { data = [], isLoading } = useNutritionHistory(from, to, enabled, clientId)
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'dd/MM'),
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    target: calorieTarget ?? undefined,
  }))
  const average = data.length
    ? Math.round(data.reduce((sum, item) => sum + item.calories, 0) / data.length)
    : null
  const macroAverage = data.length
    ? {
        proteinG: Math.round(data.reduce((sum, item) => sum + item.proteinG, 0) / data.length),
        carbsG: Math.round(data.reduce((sum, item) => sum + item.carbsG, 0) / data.length),
        fatG: Math.round(data.reduce((sum, item) => sum + item.fatG, 0) / data.length),
      }
    : null

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LineChartIcon size={17} className="text-primary" />
          <h2 className="text-lg font-semibold text-text">{tn.advancedTitle}</h2>
        </div>
        <p className="text-sm text-muted">
          {average ? tn.advancedAvg.replace('{n}', String(average)) : tn.advancedNoLogs}
        </p>
      </div>
      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Spinner /></div>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-muted">{tn.advancedEmpty}</p>
      ) : (
        <div className="space-y-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--fg-3)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--fg-3)', fontSize: 12 }} width={48} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 8 }}
                  formatter={(value, name) => [
                    `${value} ${name === 'calories' || name === 'target' ? tn.kcal : 'g'}`,
                    name === 'proteinG'
                      ? tn.proteinShort
                      : name === 'carbsG'
                        ? tn.carbsShort
                        : name === 'fatG'
                          ? tn.fatShort
                          : name === 'target'
                            ? tn.targetLabel
                            : tn.caloriesShort,
                  ]}
                />
                <Line type="monotone" dataKey="calories" stroke="var(--xn-clay-800)" strokeWidth={2} dot={false} />
                {calorieTarget && (
                  <Line type="monotone" dataKey="target" stroke="var(--xn-warning)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'var(--fg-3)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--fg-3)', fontSize: 12 }} width={40} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 8 }}
                    cursor={{ stroke: 'var(--fg-3)', strokeDasharray: '4 4' }}
                    formatter={(value, name) => [
                      `${value} g`,
                      name === 'proteinG' ? tn.proteinShort : name === 'carbsG' ? tn.carbsShort : tn.fatShort,
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="proteinG"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 2, fill: 'var(--bg-1)' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="carbsG"
                    stroke="var(--xn-success)"
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 2, fill: 'var(--bg-1)' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fatG"
                    stroke="var(--xn-warning)"
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 2, fill: 'var(--bg-1)' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {macroAverage && (
              <div className="grid gap-2 self-start">
                <AverageMacroPill label={tn.proteinShort} value={macroAverage.proteinG} color="var(--color-primary)" />
                <AverageMacroPill label={tn.carbsShort} value={macroAverage.carbsG} color="var(--xn-success)" />
                <AverageMacroPill label={tn.fatShort} value={macroAverage.fatG} color="var(--xn-warning)" />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
        <div className="mb-3 flex items-center gap-2">
          <Utensils size={17} className="text-primary" />
          <h3 className="text-base font-semibold text-text">{tn.historyCardsTitle}</h3>
        </div>
        <NutritionHistoryCards
          from={from}
          to={to}
          enabled={enabled}
          clientId={clientId}
          calorieTarget={calorieTarget}
        />
      </div>
    </Card>
  )
}

function NutritionInsightPanel({
  clientId,
  enabled,
  summary,
  logForm,
}: {
  clientId?: string
  enabled: boolean
  summary: NutritionSummaryResponse
  logForm: LogForm
}) {
  const t = useT()
  const tn = t.nutrition
  const to = format(new Date(), 'yyyy-MM-dd')
  const from = format(subDays(new Date(), 13), 'yyyy-MM-dd')
  const { data = [], isLoading } = useNutritionHistory(from, to, enabled, clientId)
  const insight = buildNutritionInsight(summary, logForm, data, tn)

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles size={17} className="text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-text">{tn.nutritionInsightTitle}</h2>
            <p className="text-sm text-muted">{tn.nutritionInsightSubtitle}</p>
          </div>
        </div>
        <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}>
          {tn.last14Days}
        </span>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Spinner /></div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <InsightMetric icon={<Scale size={17} />} label={tn.weightGap} value={insight.weightGap} detail={insight.weightNote} />
            <InsightMetric icon={<Flame size={17} />} label={tn.calorieConsistency} value={insight.calorieConsistency} detail={insight.calorieNote} />
            <InsightMetric icon={<Utensils size={17} />} label={tn.macroBalance} value={insight.macroBalance} detail={insight.macroNote} />
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp size={17} className="text-primary" />
              <h3 className="font-semibold text-text">{tn.nutritionNextMove}</h3>
            </div>
            <div className="space-y-3">
              {insight.actions.map((action) => (
                <div key={action.title} className="rounded-lg px-3 py-2" style={{ background: 'var(--bg-3)' }}>
                  <p className="font-semibold text-text">{action.title}</p>
                  <p className="mt-1 text-sm text-muted">{action.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

function InsightMetric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold text-text">{value}</p>
      <p className="mt-1 text-sm text-muted">{detail}</p>
    </div>
  )
}

function buildNutritionInsight(
  summary: NutritionSummaryResponse,
  logForm: LogForm,
  history: { calories: number; proteinG: number; carbsG: number; fatG: number }[],
  tn: Record<string, string>,
) {
  const calc = summary.calculation
  const targetWeight = summary.profile.targetWeightKg
  const bodyweight = calc.bodyweightKg
  const calorieTarget = calc.calorieTarget
  const proteinTarget = calc.proteinG
  const carbsTarget = calc.carbsG
  const fatTarget = calc.fatG
  const source = history.length > 0
    ? history
    : [{
        calories: readNumber(logForm.calories),
        proteinG: readNumber(logForm.proteinG),
        carbsG: readNumber(logForm.carbsG),
        fatG: readNumber(logForm.fatG),
      }]
  const avg = {
    calories: average(source.map((item) => item.calories)),
    proteinG: average(source.map((item) => item.proteinG)),
    carbsG: average(source.map((item) => item.carbsG)),
    fatG: average(source.map((item) => item.fatG)),
  }
  const weightDiff = bodyweight != null && targetWeight != null ? targetWeight - bodyweight : null
  const calorieDiff = calorieTarget != null ? Math.round(avg.calories - calorieTarget) : null
  const macroScores = [
    targetRatio(avg.proteinG, proteinTarget),
    targetRatio(avg.carbsG, carbsTarget),
    targetRatio(avg.fatG, fatTarget),
  ].filter((value) => value != null) as number[]
  const macroAverage = macroScores.length
    ? Math.round(macroScores.reduce((sum, value) => sum + Math.min(100, value), 0) / macroScores.length)
    : null

  const actions = [
    calorieDiff == null
      ? { title: tn.insightSetCalories, body: tn.insightSetCaloriesBody }
      : Math.abs(calorieDiff) <= 150
        ? { title: tn.insightHoldCalories, body: tn.insightHoldCaloriesBody.replace('{n}', String(Math.abs(calorieDiff))) }
        : calorieDiff > 0
          ? { title: tn.insightReduceCalories, body: tn.insightReduceCaloriesBody.replace('{n}', String(calorieDiff)) }
          : { title: tn.insightAddCalories, body: tn.insightAddCaloriesBody.replace('{n}', String(Math.abs(calorieDiff))) },
    proteinTarget && avg.proteinG < proteinTarget * 0.9
      ? { title: tn.insightProteinFirst, body: tn.insightProteinFirstBody.replace('{n}', String(Math.round(proteinTarget - avg.proteinG))) }
      : { title: tn.insightMacroTiming, body: tn.insightMacroTimingBody },
    weightDiff == null
      ? { title: tn.insightTargetWeight, body: tn.insightTargetWeightBody }
      : { title: tn.insightWeightDirection, body: formatWeightAction(weightDiff, tn) },
  ]

  return {
    weightGap: weightDiff == null ? tn.missing : `${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(1)} ${tn.kg}`,
    weightNote: weightDiff == null
      ? tn.insightMissingWeight
      : weightDiff > 0
        ? tn.insightGainNeeded
        : weightDiff < 0
          ? tn.insightLossNeeded
          : tn.insightAtTargetWeight,
    calorieConsistency: calorieDiff == null ? tn.missing : `${calorieDiff > 0 ? '+' : ''}${calorieDiff} ${tn.kcal}`,
    calorieNote: calorieDiff == null
      ? tn.insightMissingCalories
      : Math.abs(calorieDiff) <= 150
        ? tn.insightCaloriesOnTarget
        : calorieDiff > 0
          ? tn.insightCaloriesHigh
          : tn.insightCaloriesLow,
    macroBalance: macroAverage == null ? tn.missing : `${macroAverage}%`,
    macroNote: macroAverage == null
      ? tn.insightMissingMacros
      : macroAverage >= 90
        ? tn.insightMacrosOnTrack
        : tn.insightMacrosNeedWork,
    actions,
  }
}

function average(values: number[]) {
  const logged = values.filter((value) => value > 0)
  return logged.length ? logged.reduce((sum, value) => sum + value, 0) / logged.length : 0
}

function targetRatio(actual: number, target: number | null) {
  if (!target || target <= 0) return null
  return Math.round((actual / target) * 100)
}

function formatWeightAction(weightDiff: number, tn: Record<string, string>) {
  const amount = Math.abs(weightDiff).toFixed(1)
  if (Math.abs(weightDiff) < 0.5) return tn.insightWeightAtTargetBody
  if (weightDiff > 0) return tn.insightWeightGainBody.replace('{n}', amount)
  return tn.insightWeightLossBody.replace('{n}', amount)
}

function NutritionValueDiagrams({
  summary,
  caloriesActual,
  proteinActual,
  carbsActual,
  fatActual,
  tn,
}: {
  summary: NutritionSummaryResponse
  caloriesActual: number
  proteinActual: number
  carbsActual: number
  fatActual: number
  tn: Record<string, string>
}) {
  const calc = summary.calculation
  const targetMax = Math.max(calc.bmr ?? 0, calc.tdee ?? 0, calc.calorieTarget ?? 0, 1)
  const energyRows = [
    { label: tn.bmrLabel, value: calc.bmr },
    { label: tn.tdeeLabel, value: calc.tdee },
    { label: tn.targetLabel, value: calc.calorieTarget },
  ]

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Target size={17} className="text-primary" />
          <h2 className="text-lg font-semibold text-text">{tn.macroTargetsTitle}</h2>
        </div>

        <CaloriesBar
          actual={caloriesActual}
          target={calc.calorieTarget}
          unit={tn.kcal}
          missingLabel={tn.missing}
        />

        <div className="mt-5">
          <MacroDonut
            proteinG={proteinActual}
            carbsG={carbsActual}
            fatG={fatActual}
            proteinLabel={tn.proteinShort}
            carbsLabel={tn.carbsShort}
            fatLabel={tn.fatShort}
            proteinTarget={calc.proteinG}
            carbsTarget={calc.carbsG}
            fatTarget={calc.fatG}
            missingLabel={tn.missing}
          />
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Flame size={17} className="text-primary" />
          <h2 className="text-lg font-semibold text-text">{tn.targetLabel}</h2>
        </div>
        <div className="space-y-4">
          {energyRows.map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-text">{row.label}</span>
                <span className="text-muted">{formatKcal(row.value, tn.kcal, tn.missing)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full" style={{ background: 'var(--bg-3)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${row.value ? Math.max(8, (row.value / targetMax) * 100) : 0}%`,
                    background: row.label === tn.targetLabel ? 'var(--color-primary)' : 'var(--xn-clay-700)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg px-3 py-2" style={{ background: 'var(--bg-3)' }}>
            <p className="text-muted">{tn.goalLabel}</p>
            <p className="font-semibold text-text">{summary.profile.goal}</p>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: 'var(--bg-3)' }}>
            <p className="text-muted">{tn.bodyweightLabel}</p>
            <p className="font-semibold text-text">
              {calc.bodyweightKg ? `${calc.bodyweightKg} ${tn.kg}` : tn.missing}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function AverageMacroPill({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-3)', border: '1px solid var(--border-1)' }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
          <span className="text-sm font-medium text-text">{label}</span>
        </div>
        <span className="text-sm font-semibold text-text">{value}g</span>
      </div>
    </div>
  )
}

interface ProfileForm {
  activityLevel: ActivityLevel
  goal: NutritionGoal
  targetWeightKg: string
  customCalorieTarget: string
  proteinPerKg: string
  fatPerKg: string
}

interface LogForm {
  calories: string
  proteinG: string
  carbsG: string
  fatG: string
  notes: string
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="space-y-2" animate={false}>
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-text">{value}</p>
    </Card>
  )
}

function MacroDonut({
  proteinG,
  carbsG,
  fatG,
  proteinLabel,
  carbsLabel,
  fatLabel,
  proteinTarget,
  carbsTarget,
  fatTarget,
  missingLabel,
}: {
  proteinG: number
  carbsG: number
  fatG: number
  proteinLabel: string
  carbsLabel: string
  fatLabel: string
  proteinTarget: number | null
  carbsTarget: number | null
  fatTarget: number | null
  missingLabel: string
}) {
  const total = proteinG + carbsG + fatG
  const segments = [
    { label: proteinLabel, value: proteinG, target: proteinTarget, color: '#6366f1' },
    { label: carbsLabel,   value: carbsG,   target: carbsTarget,   color: '#22c55e' },
    { label: fatLabel,     value: fatG,     target: fatTarget,     color: '#f97316' },
  ]
  const pieData = total > 0
    ? segments.map((s) => ({ ...s, pieValue: s.value }))
    : [{ label: '', value: 0, target: null, color: 'var(--bg-3)', pieValue: 1 }]

  return (
    <div className="flex items-center gap-4">
      <PieChart width={130} height={130}>
        <Pie
          data={pieData}
          cx={65}
          cy={65}
          innerRadius={36}
          outerRadius={58}
          dataKey="pieValue"
          strokeWidth={2}
          stroke="var(--bg-2)"
          startAngle={90}
          endAngle={-270}
        >
          {pieData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>

      <div className="flex flex-1 flex-col gap-2.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="flex-1 text-muted">{s.label}</span>
            <span className="font-semibold text-text">{Math.round(s.value)}g</span>
            <span className="text-xs text-muted">/ {s.target ?? missingLabel}g</span>
          </div>
        ))}
        {total > 0 && (
          <p className="mt-0.5 text-xs text-muted">{Math.round(total)}g total</p>
        )}
      </div>
    </div>
  )
}

function CaloriesBar({
  actual,
  target,
  unit,
  missingLabel,
}: {
  actual: number
  target: number | null
  unit: string
  missingLabel: string
}) {
  const pct = target && target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium" style={{ color: 'var(--fg-1)' }}>Calories</span>
        <span style={{ color: 'var(--fg-3)' }}>
          {Math.round(actual)} / {target ?? missingLabel} {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg-3)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(actual > 0 ? 2 : 0, pct)}%`,
            background: 'var(--color-primary)',
          }}
        />
      </div>
      <p className="mt-1 text-xs" style={{ color: 'var(--fg-3)' }}>{pct}%</p>
    </div>
  )
}


function toField(value: number | null | undefined) {
  return value == null ? '' : String(value)
}

function optionalNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function readNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatKcal(value: number | null, kcalUnit: string, missingLabel: string) {
  return value == null ? missingLabel : `${value} ${kcalUnit}`
}

function formatMissingField(field: string, dateOfBirthLabel: string) {
  return field === 'dateOfBirth' ? dateOfBirthLabel : field
}
