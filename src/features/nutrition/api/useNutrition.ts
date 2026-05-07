import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type {
  NutritionDailyLogResponse,
  NutritionHistoryItemResponse,
  NutritionSummaryResponse,
  UpdateNutritionDailyLogRequest,
  UpdateNutritionProfileRequest,
} from '../types'

export const nutritionKeys = {
  all: ['nutrition'] as const,
  summary: (clientId?: string) => ['nutrition', 'summary', clientId ?? 'me'] as const,
  log: (date: string, clientId?: string) => ['nutrition', 'log', clientId ?? 'me', date] as const,
  history: (from: string, to: string, clientId?: string) =>
    ['nutrition', 'history', clientId ?? 'me', from, to] as const,
}

export function useNutritionSummary(clientId?: string) {
  return useQuery({
    queryKey: nutritionKeys.summary(clientId),
    queryFn: () =>
      api
        .get<NutritionSummaryResponse>(
          clientId ? ENDPOINTS.nutrition.clientSummary(clientId) : ENDPOINTS.nutrition.summary,
        )
        .then((r) => r.data),
    enabled: clientId !== '',
  })
}

export function useUpdateNutritionProfile(clientId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateNutritionProfileRequest) =>
      api
        .put(
          clientId ? ENDPOINTS.nutrition.clientProfile(clientId) : ENDPOINTS.nutrition.profile,
          data,
        )
        .then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: nutritionKeys.summary(clientId) })
    },
  })
}

export function useNutritionDailyLog(date: string, clientId?: string) {
  return useQuery({
    queryKey: nutritionKeys.log(date, clientId),
    queryFn: () =>
      api
        .get<NutritionDailyLogResponse>(
          clientId ? ENDPOINTS.nutrition.clientLog(clientId, date) : ENDPOINTS.nutrition.log(date),
        )
        .then((r) => r.data),
    retry: false,
  })
}

export function useUpdateNutritionDailyLog(date: string, clientId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateNutritionDailyLogRequest) =>
      api
        .put<NutritionDailyLogResponse>(
          clientId ? ENDPOINTS.nutrition.clientLog(clientId, date) : ENDPOINTS.nutrition.log(date),
          data,
        )
        .then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: nutritionKeys.summary(clientId) })
      void qc.invalidateQueries({ queryKey: nutritionKeys.log(date, clientId) })
      void qc.invalidateQueries({ queryKey: nutritionKeys.all })
    },
  })
}

export function useNutritionHistory(from: string, to: string, enabled: boolean, clientId?: string) {
  return useQuery({
    queryKey: nutritionKeys.history(from, to, clientId),
    queryFn: () =>
      api
        .get<NutritionHistoryItemResponse[]>(
          clientId
            ? ENDPOINTS.nutrition.clientHistory(clientId, from, to)
            : ENDPOINTS.nutrition.history(from, to),
        )
        .then((r) => r.data),
    enabled,
    retry: false,
  })
}
