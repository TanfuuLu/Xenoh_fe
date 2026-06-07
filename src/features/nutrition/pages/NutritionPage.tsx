import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { format } from 'date-fns'
import { Activity, ChevronLeft, Flame, Sparkles, Target, Utensils } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import { AnimatedNumber } from '@/shared/components/AnimatedNumber'
import { useT } from '@/shared/i18n'
import { RequireTier } from '@/features/billing/components/RequireTier'
import {
  useNutritionSummary,
  useUpdateNutritionProfile,
} from '../api/useNutrition'
import { useDayFoodLogs } from '../api/useFoodLog'
import { FoodLogPanel } from '../components/FoodLog/FoodLogPanel'
import { MetricCard, NutritionValueDiagrams } from '../components/NutritionValueDiagrams'
import { NutritionHistoryPanel } from '../components/NutritionPanels'
import {
  toField,
  optionalNumber,
  readNumber,
  formatMissingField,
  type ProfileForm,
  type LogForm,
} from '../components/nutritionHelpers'
import type {
  ActivityLevel,
  NutritionGoal,
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
        <Link to={isClientView ? `/coach/clients/${clientId}/nutrition/insight` : '/nutrition/insight'} className="shrink-0">
          <Button
            variant="secondary"
            size="sm"
            className="whitespace-nowrap"
          >
            <Sparkles size={16} /> {tn.nutritionInsight}
          </Button>
        </Link>
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
        <MetricCard
          icon={<Activity size={20} />}
          label={tn.bmrLabel}
          value={calc.bmr != null ? <AnimatedNumber value={calc.bmr} suffix={` ${tn.kcal}`} /> : tn.missing}
          accent="var(--ic-green)"
        />
        <MetricCard
          icon={<Flame size={20} />}
          label={tn.tdeeLabel}
          value={calc.tdee != null ? <AnimatedNumber value={calc.tdee} suffix={` ${tn.kcal}`} /> : tn.missing}
          accent="var(--ic-orange)"
        />
        <MetricCard
          icon={<Target size={20} />}
          label={tn.targetLabel}
          value={calc.calorieTarget != null ? <AnimatedNumber value={calc.calorieTarget} suffix={` ${tn.kcal}`} /> : tn.missing}
          accent="var(--ic-purple)"
          sub={summary.profile.goal}
          highlight
        />
        <MetricCard
          icon={<Utensils size={20} />}
          label={tn.bodyweightLabel}
          value={calc.bodyweightKg ? <AnimatedNumber value={calc.bodyweightKg} decimals={1} suffix={` ${tn.kg}`} /> : tn.missing}
          accent="var(--ic-blue)"
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
              <div className="rounded-lg p-3" style={{ background: 'var(--bg-3)' }}>
                <p className="text-xs" style={{ color: 'var(--fg-3)' }}>{tn.caloriesLabel}</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--fg-1)' }}>{readNumber(logForm.calories)} kcal</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--bg-3)' }}>
                <p className="text-xs" style={{ color: 'var(--fg-3)' }}>{tn.proteinLabel}</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--fg-1)' }}>{readNumber(logForm.proteinG)}g</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--bg-3)' }}>
                <p className="text-xs" style={{ color: 'var(--fg-3)' }}>{tn.carbsLabel}</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--fg-1)' }}>{readNumber(logForm.carbsG)}g</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--bg-3)' }}>
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
