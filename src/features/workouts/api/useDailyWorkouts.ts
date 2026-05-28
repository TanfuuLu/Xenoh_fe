import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { useLangStore } from '@/shared/i18n'
import { dayKeys, invalidateWorkoutQueries } from './workoutQueryCache'
import type { DayStatus } from '@/shared/types/api'
import type { PagedResponse } from '@/shared/types/api'
import type { CopyDayRequest, CopyDayResponse, DailyWorkoutResponse, WorkoutGuidanceResponse } from '../types'

const DAY_PAGE_SIZE = 7

export function useDailyWorkouts(weeklyWorkoutId: string) {
  const query = useInfiniteQuery({
    queryKey: dayKeys.byWeek(weeklyWorkoutId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api
        .get<PagedResponse<DailyWorkoutResponse>>(ENDPOINTS.days.byWeek(weeklyWorkoutId), {
          params: { pageNumber: pageParam, pageSize: DAY_PAGE_SIZE },
        })
        .then((r) => r.data),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.pageNumber + 1 : undefined),
    enabled: !!weeklyWorkoutId,
    retry: (count, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      return status !== 404 && count < 3
    },
  })

  return {
    ...query,
    data: query.data?.pages.flatMap((page) => page.items),
    totalCount: query.data?.pages[0]?.totalCount ?? 0,
  }
}

export function useMarkDayStatus(weeklyWorkoutId: string, planId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ dailyWorkoutId, status }: { dailyWorkoutId: string; status: DayStatus }) =>
      api.patch(ENDPOINTS.days.markStatus(dailyWorkoutId), { status }),
    onSuccess: (_result, vars) =>
      invalidateWorkoutQueries(qc, {
        dailyWorkoutId: vars.dailyWorkoutId,
        weeklyWorkoutId,
        planId,
      }),
  })
}

export function useCopyDay(weeklyWorkoutId: string, planId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sourceDailyWorkoutId, data }: { sourceDailyWorkoutId: string; data: CopyDayRequest }) =>
      api
        .post<CopyDayResponse>(ENDPOINTS.days.copy(sourceDailyWorkoutId), data)
        .then((r) => r.data),
    onSuccess: (result) =>
      invalidateWorkoutQueries(qc, {
        dailyWorkoutId: result.targetDailyWorkoutId,
        weeklyWorkoutId,
        planId,
      }),
  })
}

export function useDailyWorkoutGuidance(dailyWorkoutId: string, enabled = true) {
  const lang = useLangStore((s) => s.lang)
  return useQuery({
    queryKey: dayKeys.aiGuidance(dailyWorkoutId, lang),
    queryFn: () =>
      api
        .get<WorkoutGuidanceResponse>(ENDPOINTS.days.aiGuidance(dailyWorkoutId, lang))
        .then((r) => r.data),
    enabled: enabled && !!dailyWorkoutId,
    retry: false,
  })
}
