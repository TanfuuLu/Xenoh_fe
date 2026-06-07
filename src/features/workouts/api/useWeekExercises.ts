import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { exerciseKeys } from './workoutQueryCache'
import type { ExerciseResponse } from '../types'

/**
 * Fetches every exercise for a whole week in a single request
 * (backend returns all days' exercises, avoiding an N+1 per-day fetch).
 * Shared by the week snapshot card and the full Week Analyze page so
 * the two share one cache entry.
 */
export function useWeekExercises(weekId: string) {
  return useQuery({
    queryKey: exerciseKeys.byWeek(weekId),
    queryFn: () =>
      api.get<ExerciseResponse[]>(ENDPOINTS.exercises.byWeek(weekId)).then((r) => r.data),
    enabled: !!weekId,
  })
}
