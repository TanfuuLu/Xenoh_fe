import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { useLangStore } from '@/shared/i18n'
import type {
  ClientCycleOverviewResponse,
  CycleDailyLogResponse,
  CycleInsightResponse,
  CycleOverviewResponse,
  CycleSettingsResponse,
  UpdateCycleSettingsRequest,
  UpsertCycleLogRequest,
} from '../types'

export const cycleKeys = {
  all: ['cycle'] as const,
  overview: ['cycle', 'overview'] as const,
  logs: (from: string, to: string) => ['cycle', 'logs', from, to] as const,
  settings: ['cycle', 'settings'] as const,
  insight: (lang: 'en' | 'vi') => ['cycle', 'insight', lang] as const,
  clientOverview: (clientId: string) => ['cycle', 'client-overview', clientId] as const,
}

const AI_STALE_TIME = 5 * 60 * 1000

export function useCycleOverview(enabled = true) {
  return useQuery({
    queryKey: cycleKeys.overview,
    queryFn: () => api.get<CycleOverviewResponse>(ENDPOINTS.cycle.overview).then((r) => r.data),
    enabled,
    retry: false,
  })
}

export function useCycleLogs(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: cycleKeys.logs(from, to),
    queryFn: () =>
      api.get<CycleDailyLogResponse[]>(ENDPOINTS.cycle.logs(from, to)).then((r) => r.data),
    enabled,
    retry: false,
  })
}

export function useUpsertCycleLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ date, data }: { date: string; data: UpsertCycleLogRequest }) =>
      api.put<CycleDailyLogResponse>(ENDPOINTS.cycle.log(date), data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: cycleKeys.all })
    },
  })
}

export function useDeleteCycleLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (date: string) => api.delete(ENDPOINTS.cycle.log(date)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: cycleKeys.all })
    },
  })
}

export function useCycleSettings(enabled = true) {
  return useQuery({
    queryKey: cycleKeys.settings,
    queryFn: () => api.get<CycleSettingsResponse>(ENDPOINTS.cycle.settings).then((r) => r.data),
    enabled,
    retry: false,
  })
}

export function useUpdateCycleSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateCycleSettingsRequest) =>
      api.put<CycleSettingsResponse>(ENDPOINTS.cycle.settings, data).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(cycleKeys.settings, data)
      void qc.invalidateQueries({ queryKey: cycleKeys.overview })
    },
  })
}

export function useCycleInsight(enabled = true) {
  const lang = useLangStore((s) => s.lang)
  return useQuery({
    queryKey: cycleKeys.insight(lang),
    queryFn: () =>
      api.get<CycleInsightResponse>(ENDPOINTS.cycle.insight(lang)).then((r) => r.data),
    enabled,
    staleTime: AI_STALE_TIME,
    retry: false,
  })
}

export function useClientCycleOverview(clientId: string) {
  return useQuery({
    queryKey: cycleKeys.clientOverview(clientId),
    queryFn: () =>
      api
        .get<ClientCycleOverviewResponse>(ENDPOINTS.cycle.clientOverview(clientId))
        .then((r) => r.data),
    enabled: !!clientId,
    retry: false,
  })
}
