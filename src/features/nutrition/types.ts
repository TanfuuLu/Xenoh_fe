export type ActivityLevel = 'Sedentary' | 'Light' | 'Moderate' | 'VeryActive' | 'Athlete'
export type NutritionGoal = 'Cut' | 'Maintain' | 'Bulk'

export interface NutritionProfileResponse {
  activityLevel: ActivityLevel
  goal: NutritionGoal
  targetWeightKg: number | null
  customCalorieTarget: number | null
  proteinPerKg: number | null
  fatPerKg: number | null
}

export interface NutritionCalculationResult {
  missingFields: string[]
  bodyweightKg: number | null
  age: number | null
  bmr: number | null
  tdee: number | null
  recommendedCalories: number | null
  calorieTarget: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
}

export interface NutritionDailyLogResponse {
  date: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  notes: string | null
}

export interface NutritionSummaryResponse {
  userId: string
  profile: NutritionProfileResponse
  calculation: NutritionCalculationResult
  todayLog: NutritionDailyLogResponse | null
  canUseAdvancedAnalysis: boolean
}

export interface NutritionHistoryItemResponse {
  date: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export interface UpdateNutritionProfileRequest {
  activityLevel: ActivityLevel
  goal: NutritionGoal
  targetWeightKg: number | null
  customCalorieTarget: number | null
  proteinPerKg: number | null
  fatPerKg: number | null
}

export interface UpdateNutritionDailyLogRequest {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  notes: string | null
}
