import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { PlanAnalyticsResponse } from '../types'

export const progressKeys = {
  analytics: (planId: string) => ['progress', 'analytics', planId] as const,
}

export function usePlanAnalytics(planId: string | null) {
  return useQuery({
    queryKey: progressKeys.analytics(planId ?? ''),
    queryFn: () =>
      api
        .get<PlanAnalyticsResponse>(ENDPOINTS.plans.analytics(planId!))
        .then((r) => r.data),
    enabled: !!planId,
  })
}
