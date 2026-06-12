import { useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { exerciseKeys, invalidateWorkoutQueries } from './workoutQueryCache'
import type { PagedResponse } from '@/shared/types/api'
import type {
  CompleteSetRequest,
  CreateExerciseRequest,
  ExerciseResponse,
  ReorderExercisesRequest,
  SkipExerciseRequest,
  UpdateExerciseRequest,
} from '../types'

const EXERCISE_PAGE_SIZE = 12
type ExercisePages = InfiniteData<PagedResponse<ExerciseResponse>>

function mapExercisePages(
  data: ExercisePages | undefined,
  mapper: (exercise: ExerciseResponse) => ExerciseResponse,
) {
  if (!data) return data

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map(mapper),
    })),
  }
}

function reorderLoadedExercisePages(
  data: ExercisePages | undefined,
  exerciseIds: string[],
) {
  if (!data) return data

  const loaded = data.pages.flatMap((page) => page.items)
  const byId = new Map(loaded.map((exercise) => [exercise.id, exercise]))
  const orderedLoaded = exerciseIds
    .map((id, index) => {
      const exercise = byId.get(id)
      return exercise ? { ...exercise, sortOrder: index } : null
    })
    .filter((exercise): exercise is ExerciseResponse => exercise != null)
  let offset = 0

  return {
    ...data,
    pages: data.pages.map((page) => {
      const items = orderedLoaded.slice(offset, offset + page.items.length)
      offset += page.items.length
      return { ...page, items: items.length > 0 ? items : page.items }
    }),
  }
}

export function useExercises(dailyWorkoutId: string) {
  const query = useInfiniteQuery({
    queryKey: exerciseKeys.byDay(dailyWorkoutId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api
        .get<PagedResponse<ExerciseResponse>>(ENDPOINTS.exercises.byDay(dailyWorkoutId), {
          params: { pageNumber: pageParam, pageSize: EXERCISE_PAGE_SIZE },
        })
        .then((r) => r.data),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.pageNumber + 1 : undefined),
    enabled: !!dailyWorkoutId,
    retry: (count, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      return status !== 404 && count < 3
    },
  })

  // Memoize the flattened list so its reference stays stable while the underlying
  // pages are unchanged. Without this, every render produces a new array, which
  // makes consumers that copy it into state inside an effect loop infinitely.
  const data = useMemo(
    () => query.data?.pages.flatMap((page) => page.items),
    [query.data],
  )

  return {
    ...query,
    data,
    totalCount: query.data?.pages[0]?.totalCount ?? 0,
  }
}

export function useCreateExercise(dailyWorkoutId: string, weeklyWorkoutId?: string, planId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateExerciseRequest) =>
      api.post<ExerciseResponse>(ENDPOINTS.exercises.create, data).then((r) => r.data),
    onSuccess: () => {
      invalidateWorkoutQueries(qc, { dailyWorkoutId, weeklyWorkoutId, planId })
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

export function useSkipExercise(dailyWorkoutId: string, weeklyWorkoutId?: string, planId?: string) {
  const qc = useQueryClient()
  const key = exerciseKeys.byDay(dailyWorkoutId)

  return useMutation({
    mutationFn: (data: SkipExerciseRequest) =>
      api
        .patch<ExerciseResponse>(ENDPOINTS.exercises.skip(data.exerciseId), data)
        .then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData<ExercisePages>(key, (old) =>
        mapExercisePages(old, (exercise) => (exercise.id === updated.id ? updated : exercise)),
      )
      invalidateWorkoutQueries(qc, {
        dailyWorkoutId,
        weeklyWorkoutId,
        planId,
        includeExerciseTracking: true,
        skipExerciseList: true,
      })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useDeleteExercise(dailyWorkoutId: string, weeklyWorkoutId?: string, planId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.exercises.delete(id)),
    onSuccess: () => {
      invalidateWorkoutQueries(qc, { dailyWorkoutId, weeklyWorkoutId, planId })
    },
  })
}

export function useReorderExercises(dailyWorkoutId: string, weeklyWorkoutId?: string, planId?: string) {
  const qc = useQueryClient()
  const key = exerciseKeys.byDay(dailyWorkoutId)

  return useMutation({
    mutationFn: (data: ReorderExercisesRequest) =>
      api
        .patch<ExerciseResponse[]>(ENDPOINTS.exercises.reorderByDay(dailyWorkoutId), data)
        .then((r) => r.data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<ExercisePages>(key)

      qc.setQueryData<ExercisePages>(key, (old) => reorderLoadedExercisePages(old, data.exerciseIds))

      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous)
    },
    onSettled: () => invalidateWorkoutQueries(qc, { dailyWorkoutId, weeklyWorkoutId, planId }),
  })
}

export function useCompleteSet(dailyWorkoutId: string, weeklyWorkoutId?: string, planId?: string) {
  const qc = useQueryClient()
  const key = exerciseKeys.byDay(dailyWorkoutId)
  // Scope so we can tell when *this* day's set-completions are all done. Tapping
  // several sets quickly fires concurrent mutations against the same cache key.
  const mutationKey = ['complete-set', dailyWorkoutId] as const

  return useMutation({
    mutationKey,
    mutationFn: ({ setId, data }: { setId: string; data: CompleteSetRequest }) =>
      api
        .patch<ExerciseResponse>(ENDPOINTS.exercises.completeSet(setId), data)
        .then((r) => r.data),

    // Optimistic update — UI responds instantly, no waiting for server
    onMutate: async ({ setId, data }) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<ExercisePages>(key)

      qc.setQueryData<ExercisePages>(key, (old) =>
        mapExercisePages(old, (exercise) => {
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

    // Reconcile with the server only once the *last* concurrent completion for this
    // day settles. The optimistic update in onMutate already accumulates every tap
    // correctly, so the card is green the instant you click. If we instead applied
    // each response as it arrived, an earlier request's response (which predates the
    // later sets) would report the exercise as not-yet-complete and flip the card
    // green→white→green for the 1–2s until the final response lands.
    onSettled: (updated, error) => {
      // > 1 means other set-completions for this day are still in flight; let the
      // last one do the reconciliation. (The settling mutation itself counts as 1.)
      if (qc.isMutating({ mutationKey }) > 1) return

      if (error) {
        // Drop the optimistic guesses and refetch the real state.
        void qc.invalidateQueries({ queryKey: key })
      } else if (updated) {
        // The PATCH response is the authoritative exercise (server-computed
        // isCompleted / PR / XP). Write it straight in — no card refetch, no flicker.
        qc.setQueryData<ExercisePages>(key, (old) =>
          mapExercisePages(old, (exercise) => (exercise.id === updated.id ? updated : exercise)),
        )
      }

      // Refresh the dependent views (days, weeks, profile XP, PR tracking). The card
      // list is already current from the write above, so skip refetching it.
      invalidateWorkoutQueries(qc, {
        dailyWorkoutId,
        weeklyWorkoutId,
        planId,
        includeUserProgress: true,
        includeExerciseTracking: true,
        skipExerciseList: true,
      })
    },
  })
}

export function useSetExerciseDuration(dailyWorkoutId: string, weeklyWorkoutId?: string, planId?: string) {
  const qc = useQueryClient()
  const key = exerciseKeys.byDay(dailyWorkoutId)

  return useMutation({
    mutationFn: ({ exerciseId, durationSeconds }: { exerciseId: string; durationSeconds: number }) =>
      api
        .patch<ExerciseResponse>(ENDPOINTS.exercises.setDuration(exerciseId), {
          exerciseId,
          durationSeconds,
        })
        .then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData<ExercisePages>(key, (old) =>
        mapExercisePages(old, (exercise) => (exercise.id === updated.id ? updated : exercise)),
      )
      invalidateWorkoutQueries(qc, { dailyWorkoutId, weeklyWorkoutId, planId, includeUserProgress: true })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useStartExerciseTimer(dailyWorkoutId: string) {
  const qc = useQueryClient()
  const key = exerciseKeys.byDay(dailyWorkoutId)

  return useMutation({
    mutationFn: (exerciseId: string) =>
      api.patch<ExerciseResponse>(ENDPOINTS.exercises.startTimer(exerciseId)).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData<ExercisePages>(key, (old) =>
        mapExercisePages(old, (exercise) => (exercise.id === updated.id ? updated : exercise)),
      )
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useFinishExerciseTimer(dailyWorkoutId: string, weeklyWorkoutId?: string, planId?: string) {
  const qc = useQueryClient()
  const key = exerciseKeys.byDay(dailyWorkoutId)

  return useMutation({
    mutationFn: (exerciseId: string) =>
      api.patch<ExerciseResponse>(ENDPOINTS.exercises.finishTimer(exerciseId)).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData<ExercisePages>(key, (old) =>
        mapExercisePages(old, (exercise) => (exercise.id === updated.id ? updated : exercise)),
      )
      invalidateWorkoutQueries(qc, { dailyWorkoutId, weeklyWorkoutId, planId, includeUserProgress: true })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}
