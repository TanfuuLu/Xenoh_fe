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

// Food logging types

export type FoodItemSource = 'Seed' | 'Ai' | 'UserCustom'

export interface FoodServingResponse {
  id: string
  label: string
  grams: number
}

export interface FoodItemResponse {
  id: string
  nameVi: string
  nameEn: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  servings: FoodServingResponse[]
}

export interface FoodLogItemResponse {
  id: string
  foodItemId: string
  nameVi: string
  nameEn: string
  grams: number
  servingLabel: string | null
  servingCount: number | null
  computedCalories: number
  computedProteinG: number
  computedCarbsG: number
  computedFatG: number
}

export interface FoodLogsTotals {
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
}

export interface FoodLogsForDateResponse {
  date: string
  items: FoodLogItemResponse[]
  totals: FoodLogsTotals
}

export interface CreateFoodLogRequest {
  foodItemId: string
  grams?: number
  servingLabel?: string
  servingCount?: number
}

export interface CreateCustomFoodRequest {
  nameVi: string
  nameEn: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  defaultServingLabel?: string
  defaultServingGrams?: number
}
