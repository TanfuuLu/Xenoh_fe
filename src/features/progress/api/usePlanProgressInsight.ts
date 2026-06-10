import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { useLangStore } from '@/shared/i18n'
import type { PlanProgressInsightResponse } from '../types'

// Plan-scoped AI insight. Like the other AI endpoints it is rate-limited, so we keep
// the result fresh client-side for a few minutes to avoid re-firing on every mount.
const AI_STALE_TIME = 5 * 60 * 1000

/**
 * Loads the AI progress insight for a single plan (week-over-week trajectory),
 * distinct from the account-wide AI Insights shown on the dashboard.
 */
export function usePlanProgressInsight(planId: string | null, enabled = true) {
  const lang = useLangStore((s) => s.lang)
  return useQuery({
    queryKey: ['progress', 'plan-insight', planId ?? '', lang] as const,
    queryFn: () =>
      api
        .get<PlanProgressInsightResponse>(ENDPOINTS.insights.planProgress(planId!, lang))
        .then((r) => r.data),
    enabled: enabled && !!planId,
    staleTime: AI_STALE_TIME,
    retry: false,
  })
}
