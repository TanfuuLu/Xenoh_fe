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
}

export interface ExerciseTemplateResponse {
  id: string
  name: string
  description: string | null
  primaryMuscleGroup: MuscleGroup
  secondaryMuscleGroups: MuscleGroup[]
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
