import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type {
  CompleteSetRequest,
  CreateExerciseRequest,
  ExerciseResponse,
  ReorderExercisesRequest,
  UpdateExerciseRequest,
} from '../types'

export const exerciseKeys = {
  byDay: (dayId: string) => ['exercises', dayId] as const,
}

export function useExercises(dailyWorkoutId: string) {
  return useQuery({
    queryKey: exerciseKeys.byDay(dailyWorkoutId),
    queryFn: () =>
      api
        .get<ExerciseResponse[]>(ENDPOINTS.exercises.byDay(dailyWorkoutId))
        .then((r) => r.data),
    enabled: !!dailyWorkoutId,
  })
}

export function useCreateExercise(dailyWorkoutId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateExerciseRequest) =>
      api.post<ExerciseResponse>(ENDPOINTS.exercises.create, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: exerciseKeys.byDay(dailyWorkoutId) })
      qc.invalidateQueries({ queryKey: ['days'] })
      qc.invalidateQueries({ queryKey: ['weeks'] })
    },
  })
}

export function useUpdateExercise(dailyWorkoutId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExerciseRequest }) =>
      api.put<ExerciseResponse>(ENDPOINTS.exercises.update(id), { exerciseId: id, ...data }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: exerciseKeys.byDay(dailyWorkoutId) }),
  })
}

export function useDeleteExercise(dailyWorkoutId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.exercises.delete(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: exerciseKeys.byDay(dailyWorkoutId) })
      qc.invalidateQueries({ queryKey: ['days'] })
      qc.invalidateQueries({ queryKey: ['weeks'] })
    },
  })
}

export function useReorderExercises(dailyWorkoutId: string) {
  const qc = useQueryClient()
  const key = exerciseKeys.byDay(dailyWorkoutId)

  return useMutation({
    mutationFn: (data: ReorderExercisesRequest) =>
      api
        .patch<ExerciseResponse[]>(ENDPOINTS.exercises.reorderByDay(dailyWorkoutId), data)
        .then((r) => r.data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<ExerciseResponse[]>(key)

      qc.setQueryData<ExerciseResponse[]>(key, (old) => {
        if (!old) return old
        const byId = new Map(old.map((exercise) => [exercise.id, exercise]))
        return data.exerciseIds
          .map((id, index) => {
            const exercise = byId.get(id)
            return exercise ? { ...exercise, sortOrder: index } : null
          })
          .filter((exercise): exercise is ExerciseResponse => exercise != null)
      })

      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous)
    },
    onSuccess: (data) => qc.setQueryData(key, data),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useCompleteSet(dailyWorkoutId: string) {
  const qc = useQueryClient()
  const key = exerciseKeys.byDay(dailyWorkoutId)

  return useMutation({
    mutationFn: ({ setId, data }: { setId: string; data: CompleteSetRequest }) =>
      api
        .patch<ExerciseResponse>(ENDPOINTS.exercises.completeSet(setId), data)
        .then((r) => r.data),

    // Optimistic update — UI responds instantly, no waiting for server
    onMutate: async ({ setId, data }) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<ExerciseResponse[]>(key)

      qc.setQueryData<ExerciseResponse[]>(key, (old) =>
        old?.map((exercise) => {
          const setInThisExercise = exercise.sets.some((s) => s.id === setId)
          if (!setInThisExercise) return exercise

          const updatedSets = exercise.sets.map((s) =>
            s.id === setId
              ? {
                  ...s,
                  isCompleted: true,
                  actualReps: data.actualReps ?? s.plannedReps,
                  actualWeight: data.actualWeight ?? s.plannedWeight,
                  rpe: data.rpe ?? null,
                  completedAt: new Date().toISOString(),
                }
              : s,
          )
          const completedCount = updatedSets.filter((s) => s.isCompleted).length
          const allDone = completedCount === updatedSets.length

          return {
            ...exercise,
            sets: updatedSets,
            completedSetsCount: completedCount,
            isCompleted: allDone,
          }
        }),
      )

      return { previous }
    },

    // Rollback on error
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous)
    },

    // Sync server truth after settle — also invalidate days and weeks for cascade updates
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key })
      qc.invalidateQueries({ queryKey: ['days'] })
      qc.invalidateQueries({ queryKey: ['weeks'] })
    },
  })
}
