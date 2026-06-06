import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { useLangStore } from '@/shared/i18n'
import type { CoachChatMessage, CoachChatResponse, TrainingCoachTipResponse, UserAnalysisResponse } from '../types'

export const insightsKeys = {
  me: (lang: 'en' | 'vi') => ['insights', 'me', lang] as const,
  coachTip: (lang: 'en' | 'vi') => ['insights', 'coach-tip', lang] as const,
}

// The backend caches AI analysis per (user, language) and re-generates only
// when the underlying training data changes. The cached payload is stable for
// minutes, so we keep it fresh client-side for the same window. This avoids
// re-firing the rate-limited AI endpoints on every dashboard/insights mount
// (which previously tripped the server's 429 limiter during normal browsing).
// The "Refresh" buttons call refetch(), which bypasses staleTime on demand.
const AI_STALE_TIME = 5 * 60 * 1000

/**
 * Loads the user's AI-generated training analysis.
 */
export function useUserAnalysis() {
  const lang = useLangStore((s) => s.lang)
  return useQuery({
    queryKey: insightsKeys.me(lang),
    queryFn: () =>
      api.get<UserAnalysisResponse>(ENDPOINTS.insights.me(lang)).then((r) => r.data),
    staleTime: AI_STALE_TIME,
    retry: false,
  })
}

export function useTrainingCoachTip(enabled = true) {
  const lang = useLangStore((s) => s.lang)
  return useQuery({
    queryKey: insightsKeys.coachTip(lang),
    queryFn: () =>
      api.get<TrainingCoachTipResponse>(ENDPOINTS.insights.coachTip(lang)).then((r) => r.data),
    enabled,
    staleTime: AI_STALE_TIME,
    retry: false,
  })
}

/**
 * Sends the recent conversation to the AI coach and returns a single reply.
 * Stateless — the page owns the message history and passes it on every send.
 */
export function useCoachChat() {
  const lang = useLangStore((s) => s.lang)
  return useMutation({
    mutationFn: (messages: CoachChatMessage[]) =>
      api
        .post<CoachChatResponse>(ENDPOINTS.insights.coachChat(), { language: lang, messages })
        .then((r) => r.data),
  })
}
