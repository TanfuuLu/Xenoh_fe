export interface PersonalDashboardResponse {
  profile: PersonalDashboardProfile
  activePlan: PersonalDashboardPlan | null
  todayWorkout: PersonalDashboardTodayWorkout | null
  nutritionToday: PersonalDashboardNutrition
  nextActions: PersonalDashboardAction[]
  proInsights: PersonalDashboardProInsights
}

export interface PersonalDashboardProfile {
  firstName: string
  avatarUrl: string | null
  currentStreak: number
  level: number
  totalXp: number
  xpToNextLevel: number
  title: string
  latestBodyweight: number | null
  bmi: number | null
  bmiCategory: string | null
  dotsScore: number | null
}

export interface PersonalDashboardPlan {
  id: string
  name: string
  startDate: string
  endDate: string
  totalDays: number
  completedDays: number
  progressPercent: number
  currentWeek: PersonalDashboardWeek | null
}

export interface PersonalDashboardWeek {
  id: string
  name: string
  startDate: string
  endDate: string
  totalDays: number
  completedDays: number
  progressPercent: number
}

export interface PersonalDashboardTodayWorkout {
  id: string
  weeklyWorkoutId: string
  dayOfWeek: string
  date: string
  status: 'Normal' | 'Rest' | 'Missed' | string
  isCompleted: boolean
  totalExercises: number
  completedExercises: number
  totalSets: number
  completedSets: number
  plannedVolume: number
  muscleGroups: string[]
  route: string
}

export interface PersonalDashboardNutrition {
  calorieTarget: number | null
  proteinTargetG: number | null
  carbsTargetG: number | null
  fatTargetG: number | null
  loggedCalories: number
  loggedProteinG: number
  loggedCarbsG: number
  loggedFatG: number
  remainingCalories: number | null
  remainingProteinG: number | null
  remainingCarbsG: number | null
  remainingFatG: number | null
  missingProfileFields: string[]
}

export interface PersonalDashboardAction {
  type: string
  label: string
  description: string
  route: string
  priority: number
}

export interface PersonalDashboardProInsights {
  isUnlocked: boolean
  ctaLabel: string | null
  ctaRoute: string | null
  items: PersonalDashboardInsight[]
}

export interface PersonalDashboardInsight {
  type: string
  severity: 'Critical' | 'Warning' | 'Positive' | 'Info' | string
  title: string
  message: string
}
