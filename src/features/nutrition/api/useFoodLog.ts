import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { useDebounce } from '@/shared/hooks/useDebounce'
import type {
  CreateCustomFoodRequest,
  CreateFoodLogRequest,
  FoodItemResponse,
  FoodLogsForDateResponse,
} from '../types'
import { nutritionKeys } from './useNutrition'

export const foodLogKeys = {
  search: (q: string) => ['nutrition', 'food', 'search', q] as const,
  resolve: (name: string) => ['nutrition', 'food', 'resolve', name] as const,
  dayLogs: (date: string) => ['nutrition', 'food', 'dayLogs', date] as const,
}

export function useFoodSearch(query: string) {
  const debouncedQuery = useDebounce(query, 350)

  return useQuery({
    queryKey: foodLogKeys.search(debouncedQuery),
    queryFn: () =>
      api
        .get<FoodItemResponse[]>(ENDPOINTS.nutrition.foodSearch(debouncedQuery))
        .then((r) => r.data),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30_000,
  })
}

export function useResolveFood() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) =>
      api
        .get<FoodItemResponse>(ENDPOINTS.nutrition.foodResolve(name))
        .then((r) => r.data),
    onSuccess: (data, name) => {
      qc.setQueryData(foodLogKeys.search(name), [data])
    },
  })
}

export function useDayFoodLogs(date: string, enabled = true) {
  return useQuery({
    queryKey: foodLogKeys.dayLogs(date),
    queryFn: () =>
      api
        .get<FoodLogsForDateResponse>(ENDPOINTS.nutrition.dayFoods(date))
        .then((r) => r.data),
    staleTime: 5_000,
    enabled,
  })
}

export function useCreateFoodLog(date: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateFoodLogRequest) =>
      api.post(ENDPOINTS.nutrition.dayFoodCreate(date), data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: foodLogKeys.dayLogs(date) })
      void qc.invalidateQueries({ queryKey: nutritionKeys.summary() })
      void qc.invalidateQueries({ queryKey: nutritionKeys.log(date) })
    },
  })
}

export function useDeleteFoodLog(date: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (foodLogId: string) =>
      api.delete(ENDPOINTS.nutrition.dayFoodDelete(date, foodLogId)).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: foodLogKeys.dayLogs(date) })
      void qc.invalidateQueries({ queryKey: nutritionKeys.summary() })
      void qc.invalidateQueries({ queryKey: nutritionKeys.log(date) })
    },
  })
}

export function useCreateCustomFood() {
  return useMutation({
    mutationFn: (data: CreateCustomFoodRequest) =>
      api.post<FoodItemResponse>(ENDPOINTS.nutrition.foodCreate, data).then((r) => r.data),
  })
}
