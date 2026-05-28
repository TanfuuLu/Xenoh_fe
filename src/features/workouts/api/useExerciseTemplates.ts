import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { MuscleGroup, PagedResponse } from '@/shared/types/api'
import type {
  CustomExerciseTemplateRequest,
  ExerciseTemplateResponse,
  LastExercisePerformanceResponse,
} from '../types'

interface Filters {
  muscleGroup?: MuscleGroup
}

const EXERCISE_TEMPLATE_STALE_TIME = 5 * 60 * 1000
const EXERCISE_TEMPLATE_PAGE_SIZE = 24

export function useExerciseTemplates(filters?: Filters) {
  const query = useInfiniteQuery({
    queryKey: ['exercise-templates', filters?.muscleGroup ?? ''],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api
        .get<PagedResponse<ExerciseTemplateResponse>>(ENDPOINTS.exerciseTemplates.list, {
          params: {
            muscleGroup: filters?.muscleGroup,
            pageNumber: pageParam,
            pageSize: EXERCISE_TEMPLATE_PAGE_SIZE,
          },
        })
        .then((r) => r.data),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.pageNumber + 1 : undefined),
    staleTime: EXERCISE_TEMPLATE_STALE_TIME,
  })

  return {
    ...query,
    data: query.data?.pages.flatMap((page) => page.items),
    totalCount: query.data?.pages[0]?.totalCount ?? 0,
  }
}

export function useClientExerciseTemplates(clientId: string, filters?: Filters) {
  const query = useInfiniteQuery({
    queryKey: ['exercise-templates', 'client', clientId, filters?.muscleGroup ?? ''],
    enabled: Boolean(clientId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api
        .get<PagedResponse<ExerciseTemplateResponse>>(ENDPOINTS.exerciseTemplates.forClient(clientId), {
          params: {
            muscleGroup: filters?.muscleGroup,
            pageNumber: pageParam,
            pageSize: EXERCISE_TEMPLATE_PAGE_SIZE,
          },
        })
        .then((r) => r.data),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.pageNumber + 1 : undefined),
    staleTime: EXERCISE_TEMPLATE_STALE_TIME,
  })

  return {
    ...query,
    data: query.data?.pages.flatMap((page) => page.items),
    totalCount: query.data?.pages[0]?.totalCount ?? 0,
  }
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
