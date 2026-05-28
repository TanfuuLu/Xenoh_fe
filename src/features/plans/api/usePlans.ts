import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { exportPlanCsv } from '../utils/exportPlanCsv'
import { coachClientKeys } from '@/features/coach-client/api/useCoachClient'
import type {
  CoachPlanResponse,
  CreateAiStarterPlanRequest,
  CreatePlanForUserRequest,
  CreatePlanRequest,
  DuplicatePlanRequest,
  PlanBalanceReviewResponse,
  PlanDesignAnalysisResponse,
  PlanResponse,
  UpdatePlanRequest,
} from '../types'
import { useLangStore } from '@/shared/i18n'
import type { PagedResponse } from '@/shared/types/api'

const PLAN_PAGE_SIZE = 12

export const planKeys = {
  all: ['plans'] as const,
  byId: (id: string) => ['plans', id] as const,
  coachOverview: ['plans', 'coach-overview'] as const,
  balanceCheck: (id: string, lang: 'en' | 'vi') => ['plans', id, 'balance-check', lang] as const,
  designAnalysis: (id: string) => ['plans', id, 'design-analysis'] as const,
}

export function usePlans() {
  const query = useInfiniteQuery({
    queryKey: planKeys.all,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api
        .get<PagedResponse<PlanResponse>>(ENDPOINTS.plans.list, {
          params: { pageNumber: pageParam, pageSize: PLAN_PAGE_SIZE },
        })
        .then((r) => r.data),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.pageNumber + 1 : undefined),
  })

  return {
    ...query,
    data: query.data?.pages.flatMap((page) => page.items),
    totalCount: query.data?.pages[0]?.totalCount ?? 0,
  }
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
  const query = useInfiniteQuery({
    queryKey: planKeys.coachOverview,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api
        .get<PagedResponse<CoachPlanResponse>>(ENDPOINTS.plans.coachOverview, {
          params: { pageNumber: pageParam, pageSize: PLAN_PAGE_SIZE },
        })
        .then((r) => r.data),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.pageNumber + 1 : undefined),
    enabled,
  })

  return {
    ...query,
    data: query.data?.pages.flatMap((page) => page.items),
    totalCount: query.data?.pages[0]?.totalCount ?? 0,
  }
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

export function useDuplicatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DuplicatePlanRequest }) =>
      api.post<PlanResponse>(ENDPOINTS.plans.duplicate(id), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: planKeys.all }),
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
