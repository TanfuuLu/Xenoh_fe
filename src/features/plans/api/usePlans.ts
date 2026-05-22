import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { exportPlanCsv } from '../utils/exportPlanCsv'
import { coachClientKeys } from '@/features/coach-client/api/useCoachClient'
import type {
  CoachPlanResponse,
  CreateAiStarterPlanRequest,
  CreatePlanForUserRequest,
  CreatePlanRequest,
  PlanBalanceReviewResponse,
  PlanDesignAnalysisResponse,
  PlanResponse,
  UpdatePlanRequest,
} from '../types'
import { useLangStore } from '@/shared/i18n'

export const planKeys = {
  all: ['plans'] as const,
  byId: (id: string) => ['plans', id] as const,
  coachOverview: ['plans', 'coach-overview'] as const,
  balanceCheck: (id: string, lang: 'en' | 'vi') => ['plans', id, 'balance-check', lang] as const,
  designAnalysis: (id: string) => ['plans', id, 'design-analysis'] as const,
}

export function usePlans() {
  return useQuery({
    queryKey: planKeys.all,
    queryFn: () => api.get<PlanResponse[]>(ENDPOINTS.plans.list).then((r) => r.data),
  })
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: planKeys.byId(id),
    queryFn: () => api.get<PlanResponse>(ENDPOINTS.plans.byId(id)).then((r) => r.data),
    enabled: !!id,
    retry: (count, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      return status !== 404 && count < 3
    },
  })
}

export function useCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePlanRequest) =>
      api.post<PlanResponse>(ENDPOINTS.plans.create, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: planKeys.all }),
  })
}

export function useCreateAiStarterPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAiStarterPlanRequest) =>
      api.post<PlanResponse>(ENDPOINTS.plans.starterAi, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: planKeys.all }),
  })
}

export function useUpdatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanRequest }) =>
      api.put<PlanResponse>(ENDPOINTS.plans.update(id), data).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(planKeys.byId(data.id), data)
      void qc.invalidateQueries({ queryKey: planKeys.all })
    },
  })
}

export function useDeletePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.plans.delete(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: planKeys.all })
      void qc.invalidateQueries({ queryKey: planKeys.coachOverview })
    },
  })
}

export function useActivatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<PlanResponse>(ENDPOINTS.plans.activate(id)).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: planKeys.all }),
  })
}

export function useDeactivatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<PlanResponse>(ENDPOINTS.plans.deactivate(id)).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: planKeys.all }),
  })
}

export function useCoachPlanOverview(enabled = true) {
  return useQuery({
    queryKey: planKeys.coachOverview,
    queryFn: () =>
      api.get<CoachPlanResponse[]>(ENDPOINTS.plans.coachOverview).then((r) => r.data),
    enabled,
  })
}

export function useCreatePlanForUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePlanForUserRequest) =>
      api.post<PlanResponse>(ENDPOINTS.plans.forUser, data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: planKeys.coachOverview })
      void qc.invalidateQueries({ queryKey: planKeys.all })
      void qc.invalidateQueries({ queryKey: coachClientKeys.dashboard })
    },
  })
}

export function usePlanBalanceCheck(planId: string) {
  const lang = useLangStore((s) => s.lang)
  return useMutation({
    mutationFn: () =>
      api
        .post<PlanBalanceReviewResponse>(ENDPOINTS.plans.balanceCheck(planId, lang))
        .then((r) => r.data),
  })
}

export function useExportPlanCsv() {
  return useMutation({
    mutationFn: (planId: string) => exportPlanCsv(planId),
  })
}

export function usePlanDesignAnalysis(planId: string) {
  return useQuery({
    queryKey: planKeys.designAnalysis(planId),
    queryFn: () =>
      api.get<PlanDesignAnalysisResponse>(ENDPOINTS.plans.designAnalysis(planId)).then((r) => r.data),
    enabled: !!planId,
  })
}
