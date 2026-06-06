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

interface FoodSuggestion {
  title: string
  amount: string
  reason: string
  examples: string[]
}

interface MacroStrategy {
  title: string
  bestFor: string
  pros: string
  cons: string
  whenToUse: string
  proteinPct: number
  carbsPct: number
  fatPct: number
  calories: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  mealSplit: string
  timing: string
  recommended: boolean
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

function splitExamples(value: string) {
  return value.split('|').map((item) => item.trim()).filter(Boolean)
}

function buildFoodSuggestions(
  avg: { calories: number; proteinG: number; carbsG: number; fatG: number },
  targets: { calories: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null },
  tn: Record<string, string>,
): FoodSuggestion[] {
  const calorieDiff = targets.calories != null ? Math.round(avg.calories - targets.calories) : null
  const proteinGap = targets.proteinG != null ? Math.round(targets.proteinG - avg.proteinG) : null
  const carbsGap = targets.carbsG != null ? Math.round(targets.carbsG - avg.carbsG) : null
  const fatGap = targets.fatG != null ? Math.round(targets.fatG - avg.fatG) : null

  const suggestions: FoodSuggestion[] = []

  if (proteinGap == null || proteinGap > 10) {
    suggestions.push({
      title: tn.foodProteinTitle,
      amount: proteinGap && proteinGap > 0
        ? tn.foodProteinAmount.replace('{n}', String(Math.max(20, Math.min(45, proteinGap))))
        : tn.foodProteinDefaultAmount,
      reason: tn.foodProteinReason,
      examples: splitExamples(tn.foodProteinExamples),
    })
  }

  if (carbsGap != null && carbsGap > 25) {
    suggestions.push({
      title: tn.foodCarbTitle,
      amount: tn.foodCarbAmount.replace('{n}', String(Math.max(30, Math.min(80, carbsGap)))),
      reason: tn.foodCarbReason,
      examples: splitExamples(tn.foodCarbExamples),
    })
  }

  if (fatGap != null && fatGap > 8) {
    suggestions.push({
      title: tn.foodFatTitle,
      amount: tn.foodFatAmount.replace('{n}', String(Math.max(10, Math.min(25, fatGap)))),
      reason: tn.foodFatReason,
      examples: splitExamples(tn.foodFatExamples),
    })
  }

  if (calorieDiff != null && calorieDiff > 180) {
    suggestions.push({
      title: tn.foodReduceTitle,
      amount: tn.foodReduceAmount.replace('{n}', String(calorieDiff)),
      reason: tn.foodReduceReason,
      examples: splitExamples(tn.foodReduceExamples),
    })
  }

  if (suggestions.length === 0) {
    suggestions.push({
      title: tn.foodBalancedTitle,
      amount: tn.foodBalancedAmount,
      reason: tn.foodBalancedReason,
      examples: splitExamples(tn.foodBalancedExamples),
    })
  }

  return suggestions.slice(0, 3)
}

function buildMacroStrategies(
  summary: NutritionSummaryResponse,
  avg: { calories: number; proteinG: number; carbsG: number; fatG: number },
  targets: { calories: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null },
  tn: Record<string, string>,
): MacroStrategy[] {
  const goal = summary.profile.goal
  const calories = targets.calories
  const proteinRatio = targetRatio(avg.proteinG, targets.proteinG)
  const carbsRatio = targetRatio(avg.carbsG, targets.carbsG)
  const fatRatio = targetRatio(avg.fatG, targets.fatG)

  function macroPlan(proteinPct: number, carbsPct: number, fatPct: number) {
    return {
      proteinPct,
      carbsPct,
      fatPct,
      calories,
      proteinG: calories == null ? null : Math.round((calories * proteinPct / 100) / 4),
      carbsG: calories == null ? null : Math.round((calories * carbsPct / 100) / 4),
      fatG: calories == null ? null : Math.round((calories * fatPct / 100) / 9),
    }
  }

  return [
    {
      title: tn.strategyHighProteinTitle,
      bestFor: tn.strategyHighProteinBestFor,
      pros: tn.strategyHighProteinPros,
      cons: tn.strategyHighProteinCons,
      whenToUse: tn.strategyHighProteinUse,
      ...macroPlan(goal === 'Bulk' ? 28 : 35, goal === 'Bulk' ? 47 : 35, goal === 'Bulk' ? 25 : 30),
      mealSplit: tn.strategyHighProteinSplit,
      timing: tn.strategyHighProteinTiming,
      recommended: goal === 'Cut' || goal === 'Maintain' || proteinRatio == null || proteinRatio < 90,
    },
    {
      title: tn.strategyHighCarbTitle,
      bestFor: tn.strategyHighCarbBestFor,
      pros: tn.strategyHighCarbPros,
      cons: tn.strategyHighCarbCons,
      whenToUse: tn.strategyHighCarbUse,
      ...macroPlan(25, 55, 20),
      mealSplit: tn.strategyHighCarbSplit,
      timing: tn.strategyHighCarbTiming,
      recommended: goal === 'Bulk' || carbsRatio == null || carbsRatio < 85,
    },
    {
      title: tn.strategyHigherFatTitle,
      bestFor: tn.strategyHigherFatBestFor,
      pros: tn.strategyHigherFatPros,
      cons: tn.strategyHigherFatCons,
      whenToUse: tn.strategyHigherFatUse,
      ...macroPlan(25, 35, 40),
      mealSplit: tn.strategyHigherFatSplit,
      timing: tn.strategyHigherFatTiming,
      recommended: fatRatio != null && fatRatio < 80,
    },
  ]
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
  const targets = {
    calories: calorieTarget,
    proteinG: proteinTarget,
    carbsG: carbsTarget,
    fatG: fatTarget,
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
    foodSuggestions: buildFoodSuggestions(avg, targets, tn),
    macroStrategies: buildMacroStrategies(summary, avg, targets, tn),
  }
}
