import type { PlanType } from '@/shared/types/api'

export interface PlanResponse {
  id: string
  name: string
  startDate: string
  endDate: string
  planType: PlanType
  ownerId: string
  ownerName: string
  createdByCoachId: string | null
  coachName: string | null
  totalWeeks: number
  completedWeeks: number
  totalDays: number
  completedDays: number
  isActive: boolean
  createdAt: string
}

export interface CoachPlanResponse {
  id: string
  name: string
  startDate: string
  endDate: string
  planType: PlanType
  ownerId: string
  ownerName: string
  ownerEmail: string
  totalWeeks: number
  createdAt: string
}

export interface CreatePlanRequest {
  name: string
  startDate: string
  endDate: string
}

export interface CreatePlanForUserRequest {
  userId: string
  name: string
  startDate: string
  endDate: string
}

export interface CreateAiStarterPlanRequest {
  goal: string
  experience: string
  daysPerWeek: number
  splitPreference: string
  sessionLengthMinutes: number
  equipment: string
  startDate: string
  endDate: string
  name?: string
  description?: string
  language?: 'en' | 'vi'
}

export interface PlanBalanceReviewResponse {
  headline: string
  severity: 'Low' | 'Medium' | 'High'
  summary: string
  warnings: string[]
  suggestions: string[]
}

export interface PlanDesignAnalysisResponse {
  structure: {
    totalWeeks: number
    plannedTrainingDays: number
    plannedRestDays: number
    avgTrainingDaysPerWeek: number
    longestTrainingStreak: number
  }
  workload: {
    plannedExercises: number
    plannedSets: number
    plannedRepVolume: number
    plannedTonnage: number
    avgExercisesPerTrainingDay: number
  }
  muscleGroups: PlannedMuscleGroupPoint[]
  balance: {
    frontSets: number
    backSets: number
    upperSets: number
    lowerSets: number
    otherSets: number
    maxSets: number
    dominantMuscleGroups: string[]
    undertrainedMajorMuscleGroups: string[]
  }
  movementPatterns: MovementPatternCoveragePoint[]
  recoveryRisks: RecoveryRiskPoint[]
  variety: {
    uniqueExercises: number
    repeatedExerciseCount: number
    topRepeatedExercises: RepeatedExercisePoint[]
  }
}

export interface PlannedMuscleGroupPoint {
  muscleGroup: string
  weightedSets: number
  primarySets: number
  secondarySets: number
  percentOfTotal: number
  status: string
}

export interface MovementPatternCoveragePoint {
  pattern: string
  isCovered: boolean
  exerciseCount: number
  plannedSets: number
}

export interface RecoveryRiskPoint {
  type: string
  severity: string
  message: string
  metric: string
}

export interface RepeatedExercisePoint {
  exerciseName: string
  count: number
}

export interface UpdatePlanRequest {
  name: string
  startDate: string
  endDate: string
}

export interface DuplicatePlanRequest {
  name: string
  startDate: string
  endDate: string
}
