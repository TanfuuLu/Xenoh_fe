import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { MuscleGroup } from '@/shared/types/api'
import type { ExerciseTemplateResponse } from '../types'

interface Filters {
  muscleGroup?: MuscleGroup
}

export function useExerciseTemplates(filters?: Filters) {
  return useQuery({
    queryKey: ['exercise-templates', filters?.muscleGroup ?? ''],
    queryFn: () =>
      api
        .get<ExerciseTemplateResponse[]>(ENDPOINTS.exerciseTemplates.list, {
          params: { muscleGroup: filters?.muscleGroup },
        })
        .then((r) => r.data),
  })
}
