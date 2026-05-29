import type { ActivityLevel, NutritionGoal, NutritionSummaryResponse } from '../types'

export interface ProfileForm {
  activityLevel: ActivityLevel
  goal: NutritionGoal
  targetWeightKg: string
  customCalorieTarget: string
  proteinPerKg: string
  fatPerKg: string
}

export interface LogForm {
  calories: string
  proteinG: string
  carbsG: string
  fatG: string
  notes: string
}

export function toField(value: number | null | undefined) {
  return value == null ? '' : String(value)
}

export function optionalNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function readNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatKcal(value: number | null, kcalUnit: string, missingLabel: string) {
  return value == null ? missingLabel : `${value} ${kcalUnit}`
}

export function formatMissingField(field: string, dateOfBirthLabel: string) {
  return field === 'dateOfBirth' ? dateOfBirthLabel : field
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

export function buildNutritionInsight(
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
