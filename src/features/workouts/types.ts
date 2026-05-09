import type { DayStatus, MuscleGroup } from '@/shared/types/api'

export interface WeeklyWorkoutResponse {
  id: string
  weekNumber: number
  name: string
  startDate: string
  endDate: string
  planId: string
  totalDays: number
  completedDays: number
  hasWarning: boolean
  isCompleted: boolean
  effectiveTotalDays: number
}

export interface DailyWorkoutResponse {
  id: string
  date: string
  dayOfWeek: string
  isCompleted: boolean
  weeklyWorkoutId: string
  totalExercises: number
  completedExercises: number
  hasWarning: boolean
  status: DayStatus
}

export interface ExerciseSetResponse {
  id: string
  setNumber: number
  plannedReps: number
  plannedWeight: number | null
  actualReps: number | null
  actualWeight: number | null
  rpe: number | null
  isCompleted: boolean
  completedAt: string | null
}

export interface ExerciseResponse {
  id: string
  exerciseTemplateId: string
  name: string
  primaryMuscleGroup: MuscleGroup
  secondaryMuscleGroups: MuscleGroup[]
  exerciseKind: 'Strength' | 'Cardio'
  estimatedMet: number
  plannedSets: number
  plannedReps: number
  plannedWeight: number | null
  completedSetsCount: number
  isCompleted: boolean
  notes: string | null
  dailyWorkoutId: string
  sortOrder: number
  sets: ExerciseSetResponse[]
  personalRecordWeight: number | null
  startedAtUtc: string | null
  endedAtUtc: string | null
  durationSeconds: number | null
  estimatedCalories: number | null
  calorieEstimateStatus: 'Ready' | 'MissingDuration' | 'MissingBodyweight'
  isCompetitionLift: boolean
  imageUrl: string | null
}

export interface ExerciseTemplateResponse {
  id: string
  name: string
  description: string | null
  primaryMuscleGroup: MuscleGroup
  secondaryMuscleGroups: MuscleGroup[]
  exerciseKind: 'Strength' | 'Cardio'
  estimatedMet: number
  isCustom: boolean
  ownerId: string | null
  imageUrl: string | null
}

export interface LastExercisePerformanceResponse {
  exerciseTemplateId: string
  lastActualWeight: number | null
  lastActualReps: number | null
  lastRpe: number | null
  performedAt: string | null
  workoutDate: string | null
}

export interface CustomExerciseTemplateRequest {
  id?: string
  name: string
  description?: string
  primaryMuscleGroup: MuscleGroup
  secondaryMuscleGroups: MuscleGroup[]
  exerciseKind: 'Strength' | 'Cardio'
}

export interface CreateExerciseRequest {
  dailyWorkoutId: string
  exerciseTemplateId: string
  plannedSets: number
  plannedReps: number
  plannedWeight?: number
  notes?: string
}

export interface UpdateExerciseRequest {
  plannedSets?: number
  plannedReps?: number
  plannedWeight?: number
  notes?: string
}

export interface CompleteSetRequest {
  actualReps?: number
  actualWeight?: number
  rpe?: number
}

export interface ReorderExercisesRequest {
  dailyWorkoutId: string
  exerciseIds: string[]
}

export interface UpdateWeeklyWorkoutRequest {
  name: string
}

export interface CopyDayRequest {
  targetDailyWorkoutId: string
}

export interface CopyDayResponse {
  targetDailyWorkoutId: string
  exercisesCopied: number
}
