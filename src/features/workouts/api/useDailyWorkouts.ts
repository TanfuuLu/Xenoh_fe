import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { DayStatus } from '@/shared/types/api'
import type { CopyDayRequest, CopyDayResponse, DailyWorkoutResponse } from '../types'

export const dayKeys = {
  byWeek: (weekId: string) => ['days', weekId] as const,
}

export function useDailyWorkouts(weeklyWorkoutId: string) {
  return useQuery({
    queryKey: dayKeys.byWeek(weeklyWorkoutId),
    queryFn: () =>
      api
        .get<DailyWorkoutResponse[]>(ENDPOINTS.days.byWeek(weeklyWorkoutId))
        .then((r) => r.data),
    enabled: !!weeklyWorkoutId,
    retry: (count, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      return status !== 404 && count < 3
    },
  })
}

export function useMarkDayStatus(weeklyWorkoutId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ dailyWorkoutId, status }: { dailyWorkoutId: string; status: DayStatus }) =>
      api.patch(ENDPOINTS.days.markStatus(dailyWorkoutId), { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dayKeys.byWeek(weeklyWorkoutId) })
    },
  })
}

export function useCopyDay(weeklyWorkoutId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sourceDailyWorkoutId, data }: { sourceDailyWorkoutId: string; data: CopyDayRequest }) =>
      api
        .post<CopyDayResponse>(ENDPOINTS.days.copy(sourceDailyWorkoutId), data)
        .then((r) => r.data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: dayKeys.byWeek(weeklyWorkoutId) })
      qc.invalidateQueries({ queryKey: ['exercises', result.targetDailyWorkoutId] })
    },
  })
}
