import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { Link, useParams } from 'react-router'
import { format, subDays } from 'date-fns'
import { Activity, ChevronLeft, Flame, LineChart as LineChartIcon, Target, Utensils } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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
  useUpdateNutritionDailyLog,
  useUpdateNutritionProfile,
} from '../api/useNutrition'
import type {
  ActivityLevel,
  NutritionGoal,
  NutritionSummaryResponse,
  UpdateNutritionDailyLogRequest,
  UpdateNutritionProfileRequest,
} from '../types'

export function NutritionPage() {
  const t = useT()
  const tn = t.nutrition
  const { clientId } = useParams()
  const isClientView = Boolean(clientId)
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: summary, isLoading } = useNutritionSummary(clientId)
  const updateProfile = useUpdateNutritionProfile(clientId)
  const updateLog = useUpdateNutritionDailyLog(today, clientId)

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

  const remaining = useMemo(() => {
    if (!summary?.calculation.calorieTarget) return null
    return {
      calories: summary.calculation.calorieTarget - readNumber(logForm.calories),
      proteinG: (summary.calculation.proteinG ?? 0) - readNumber(logForm.proteinG),
      carbsG: (summary.calculation.carbsG ?? 0) - readNumber(logForm.carbsG),
      fatG: (summary.calculation.fatG ?? 0) - readNumber(logForm.fatG),
    }
  }, [logForm, summary])

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

  function saveLog() {
    const payload: UpdateNutritionDailyLogRequest = {
      calories: readNumber(logForm.calories),
      proteinG: readNumber(logForm.proteinG),
      carbsG: readNumber(logForm.carbsG),
      fatG: readNumber(logForm.fatG),
      notes: logForm.notes.trim() || null,
    }
    updateLog.mutate(payload)
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
        <NutritionValueDiagrams summary={summary} logForm={logForm} tn={tn} />
      )}

      <div className="flex flex-col gap-6">
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <Target size={17} className="text-primary" />
            <h2 className="text-lg font-semibold text-text">{tn.macroTargetsTitle}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MacroCard label={tn.proteinShort} target={calc.proteinG} actual={readNumber(logForm.proteinG)} remaining={remaining?.proteinG} unit="g" missingLabel={tn.missing} loggedLabel={tn.logged} remainingLabel={tn.remaining} />
            <MacroCard label={tn.carbsShort}   target={calc.carbsG}   actual={readNumber(logForm.carbsG)}   remaining={remaining?.carbsG}   unit="g" missingLabel={tn.missing} loggedLabel={tn.logged} remainingLabel={tn.remaining} />
            <MacroCard label={tn.fatShort}     target={calc.fatG}     actual={readNumber(logForm.fatG)}     remaining={remaining?.fatG}     unit="g" missingLabel={tn.missing} loggedLabel={tn.logged} remainingLabel={tn.remaining} />
            <MacroCard label={tn.caloriesShort} target={calc.calorieTarget} actual={readNumber(logForm.calories)} remaining={remaining?.calories} unit={tn.kcal} missingLabel={tn.missing} loggedLabel={tn.logged} remainingLabel={tn.remaining} />
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Utensils size={17} className="text-primary" />
          <h2 className="text-lg font-semibold text-text">{tn.todayIntakeTitle}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={tn.caloriesLabel}
            type="number"
            min="0"
            value={logForm.calories}
            onChange={(e) => setLogForm((f) => ({ ...f, calories: e.target.value }))}
          />
          <Input
            label={tn.proteinLabel}
            type="number"
            min="0"
            step="0.1"
            value={logForm.proteinG}
            onChange={(e) => setLogForm((f) => ({ ...f, proteinG: e.target.value }))}
          />
          <Input
            label={tn.carbsLabel}
            type="number"
            min="0"
            step="0.1"
            value={logForm.carbsG}
            onChange={(e) => setLogForm((f) => ({ ...f, carbsG: e.target.value }))}
          />
          <Input
            label={tn.fatLabel}
            type="number"
            min="0"
            step="0.1"
            value={logForm.fatG}
            onChange={(e) => setLogForm((f) => ({ ...f, fatG: e.target.value }))}
          />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text md:col-span-2">
            {tn.notesLabel}
            <textarea
              className="xn-input min-h-20 resize-y"
              value={logForm.notes}
              onChange={(e) => setLogForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={saveLog} loading={updateLog.isPending}>{tn.saveToday}</Button>
        </div>
      </Card>

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
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'var(--fg-3)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--fg-3)', fontSize: 12 }} width={36} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 8 }}
                    formatter={(value, name) => [
                      `${value} g`,
                      name === 'proteinG' ? tn.proteinShort : name === 'carbsG' ? tn.carbsShort : tn.fatShort,
                    ]}
                  />
                  <Bar dataKey="proteinG" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="carbsG" fill="var(--xn-success)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fatG" fill="var(--xn-warning)" radius={[4, 4, 0, 0]} />
                </BarChart>
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
    </Card>
  )
}

function NutritionValueDiagrams({
  summary,
  logForm,
  tn,
}: {
  summary: NutritionSummaryResponse
  logForm: LogForm
  tn: Record<string, string>
}) {
  const calc = summary.calculation
  const macroRows = [
    {
      label: tn.caloriesShort,
      target: calc.calorieTarget,
      actual: readNumber(logForm.calories),
      unit: tn.kcal,
      color: 'var(--xn-clay-800)',
    },
    {
      label: tn.proteinShort,
      target: calc.proteinG,
      actual: readNumber(logForm.proteinG),
      unit: 'g',
      color: 'var(--color-primary)',
    },
    {
      label: tn.carbsShort,
      target: calc.carbsG,
      actual: readNumber(logForm.carbsG),
      unit: 'g',
      color: 'var(--xn-success)',
    },
    {
      label: tn.fatShort,
      target: calc.fatG,
      actual: readNumber(logForm.fatG),
      unit: 'g',
      color: 'var(--xn-warning)',
    },
  ]
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
        <div className="space-y-4">
          {macroRows.map((row) => {
            const target = row.target ?? 0
            const percent = target > 0 ? Math.min(140, (row.actual / target) * 100) : 0
            return (
              <div key={row.label}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-text">{row.label}</span>
                  <span className="text-muted">
                    {Math.round(row.actual)} / {row.target ?? tn.missing} {row.unit}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full" style={{ background: 'var(--bg-3)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(row.actual > 0 ? 4 : 0, Math.min(100, percent))}%`,
                      background: row.color,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted">{Math.round(percent)}%</p>
              </div>
            )
          })}
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

function MacroCard({
  label,
  target,
  actual,
  remaining,
  unit,
  missingLabel,
  loggedLabel,
  remainingLabel,
}: {
  label: string
  target: number | null
  actual: number
  remaining?: number
  unit: string
  missingLabel: string
  loggedLabel: string
  remainingLabel: string
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm font-semibold text-text">{label}</p>
      <p className="mt-1 text-xl font-bold text-text">{target == null ? missingLabel : `${target} ${unit}`}</p>
      <p className="mt-2 text-xs text-muted">{loggedLabel}: {actual} {unit}</p>
      {remaining != null && (
        <p className="mt-1 text-xs text-muted">{remainingLabel}: {Math.round(remaining)} {unit}</p>
      )}
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
