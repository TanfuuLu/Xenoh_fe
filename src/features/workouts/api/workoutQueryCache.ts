import type { QueryClient } from '@tanstack/react-query'
import { dashboardKeys } from '@/features/dashboard/api/usePersonalDashboard'
import { exerciseTrackingKeys } from '@/features/exercise-tracking/api/useExerciseTracking'
import { profileKeys } from '@/features/profile/api/useProfile'

export const exerciseKeys = {
  all: ['exercises'] as const,
  byDay: (dayId: string) => ['exercises', 'by-day', dayId] as const,
  byWeek: (weekId: string) => ['exercises', 'by-week', weekId] as const,
}

export const dayKeys = {
  all: ['days'] as const,
  byWeek: (weekId: string) => ['days', weekId] as const,
}

export const weekKeys = {
  all: ['weeks'] as const,
  byPlan: (planId: string) => ['weeks', planId] as const,
}

interface WorkoutInvalidationScope {
  dailyWorkoutId?: string
  weeklyWorkoutId?: string
  planId?: string
  includeUserProgress?: boolean
  includeExerciseTracking?: boolean
}

export function invalidateWorkoutQueries(qc: QueryClient, scope: WorkoutInvalidationScope = {}) {
  if (scope.dailyWorkoutId) {
    void qc.invalidateQueries({ queryKey: exerciseKeys.byDay(scope.dailyWorkoutId) })
  } else {
    void qc.invalidateQueries({ queryKey: exerciseKeys.all })
  }

  if (scope.weeklyWorkoutId) {
    void qc.invalidateQueries({ queryKey: dayKeys.byWeek(scope.weeklyWorkoutId) })
  }
  void qc.invalidateQueries({ queryKey: dayKeys.all })

  if (scope.planId) {
    void qc.invalidateQueries({ queryKey: weekKeys.byPlan(scope.planId) })
  }
  void qc.invalidateQueries({ queryKey: weekKeys.all })

  if (scope.includeUserProgress) {
    void qc.invalidateQueries({ queryKey: profileKeys.me })
    void qc.invalidateQueries({ queryKey: dashboardKeys.personal })
  }

  if (scope.includeExerciseTracking) {
    void qc.invalidateQueries({ queryKey: exerciseTrackingKeys.all })
  }
}
