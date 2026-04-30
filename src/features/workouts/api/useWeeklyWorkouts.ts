import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { UpdateWeeklyWorkoutRequest, WeeklyWorkoutResponse } from '../types'

export const weekKeys = {
  byPlan: (planId: string) => ['weeks', planId] as const,
}

export function useWeeklyWorkouts(planId: string) {
  return useQuery({
    queryKey: weekKeys.byPlan(planId),
    queryFn: () =>
      api.get<WeeklyWorkoutResponse[]>(ENDPOINTS.weeks.byPlan(planId)).then((r) => r.data),
    enabled: !!planId,
    retry: (count, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      return status !== 404 && count < 3
    },
  })
}

export function useUpdateWeeklyWorkout(planId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ weekId, data }: { weekId: string; data: UpdateWeeklyWorkoutRequest }) =>
      api
        .patch<WeeklyWorkoutResponse>(ENDPOINTS.weeks.update(planId, weekId), data)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: weekKeys.byPlan(planId) }),
  })
}
