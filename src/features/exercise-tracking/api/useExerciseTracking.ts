import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { ExercisePrHistoryPointResponse, ExercisePrResponse } from '../types'

export const exerciseTrackingKeys = {
  all: ['exercise-tracking'] as const,
  prs: ['exercise-tracking', 'prs'] as const,
  history: (exerciseTemplateId: string) =>
    ['exercise-tracking', 'history', exerciseTemplateId] as const,
}

export function useExercisePrs() {
  return useQuery({
    queryKey: exerciseTrackingKeys.prs,
    queryFn: () =>
      api.get<ExercisePrResponse[]>(ENDPOINTS.users.exercisePrs).then((r) => r.data),
    refetchOnMount: 'always',
  })
}

export function useExercisePrHistory(exerciseTemplateId: string | null) {
  return useQuery({
    queryKey: exerciseTrackingKeys.history(exerciseTemplateId ?? ''),
    queryFn: () =>
      api
        .get<ExercisePrHistoryPointResponse[]>(
          ENDPOINTS.users.exercisePrHistory(exerciseTemplateId!),
        )
        .then((r) => r.data),
    enabled: !!exerciseTemplateId,
    refetchOnMount: 'always',
  })
}
