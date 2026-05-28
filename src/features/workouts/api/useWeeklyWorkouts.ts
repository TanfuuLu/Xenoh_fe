import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { weekKeys } from './workoutQueryCache'
import type { PagedResponse } from '@/shared/types/api'
import type { UpdateWeeklyWorkoutRequest, WeeklyWorkoutResponse } from '../types'

const WEEK_PAGE_SIZE = 8

export function useWeeklyWorkouts(planId: string) {
  const query = useInfiniteQuery({
    queryKey: weekKeys.byPlan(planId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api
        .get<PagedResponse<WeeklyWorkoutResponse>>(ENDPOINTS.weeks.byPlan(planId), {
          params: { pageNumber: pageParam, pageSize: WEEK_PAGE_SIZE },
        })
        .then((r) => r.data),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.pageNumber + 1 : undefined),
    enabled: !!planId,
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
