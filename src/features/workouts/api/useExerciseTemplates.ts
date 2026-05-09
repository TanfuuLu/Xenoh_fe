import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { MuscleGroup } from '@/shared/types/api'
import type {
  CustomExerciseTemplateRequest,
  ExerciseTemplateResponse,
  LastExercisePerformanceResponse,
} from '../types'

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

export function useClientExerciseTemplates(clientId: string, filters?: Filters) {
  return useQuery({
    queryKey: ['exercise-templates', 'client', clientId, filters?.muscleGroup ?? ''],
    enabled: Boolean(clientId),
    queryFn: () =>
      api
        .get<ExerciseTemplateResponse[]>(ENDPOINTS.exerciseTemplates.forClient(clientId), {
          params: { muscleGroup: filters?.muscleGroup },
        })
        .then((r) => r.data),
  })
}

export function useLastExercisePerformance(
  dailyWorkoutId: string,
  exerciseTemplateId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ['exercise-template-last-performance', dailyWorkoutId, exerciseTemplateId] as const,
    queryFn: () =>
      api
        .get<LastExercisePerformanceResponse>(
          ENDPOINTS.exerciseTemplates.lastPerformance(exerciseTemplateId, dailyWorkoutId),
        )
        .then((r) => r.data),
    enabled: enabled && !!dailyWorkoutId && !!exerciseTemplateId,
  })
}

function invalidateExerciseTemplates(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['exercise-templates'] })
}

export function useCreateCustomExerciseTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CustomExerciseTemplateRequest) =>
      api.post<ExerciseTemplateResponse>(ENDPOINTS.exerciseTemplates.custom, data).then((r) => r.data),
    onSuccess: () => invalidateExerciseTemplates(qc),
  })
}

export function useUpdateCustomExerciseTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomExerciseTemplateRequest }) =>
      api
        .put<ExerciseTemplateResponse>(ENDPOINTS.exerciseTemplates.customById(id), { ...data, id })
        .then((r) => r.data),
    onSuccess: () => invalidateExerciseTemplates(qc),
  })
}

export function useDeleteCustomExerciseTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.exerciseTemplates.customById(id)).then(() => undefined),
    onSuccess: () => invalidateExerciseTemplates(qc),
  })
}

export function useCreateCustomExerciseTemplateForClient(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CustomExerciseTemplateRequest) =>
      api
        .post<ExerciseTemplateResponse>(ENDPOINTS.exerciseTemplates.customForClient(clientId), {
          ...data,
          clientId,
        })
        .then((r) => r.data),
    onSuccess: () => {
      invalidateExerciseTemplates(qc)
      void qc.invalidateQueries({ queryKey: ['exercise-templates', 'client', clientId] })
    },
  })
}
