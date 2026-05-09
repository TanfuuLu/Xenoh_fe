import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { useLangStore } from '@/shared/i18n'
import type { UserAnalysisResponse } from '../types'

export const insightsKeys = {
  me: (lang: 'en' | 'vi') => ['insights', 'me', lang] as const,
}

/**
 * Loads the user's AI-generated training analysis. The backend caches per
 * (user, language) and re-generates only when underlying data has changed,
 * so this hook can safely re-run on every page mount without burning tokens.
 */
export function useUserAnalysis() {
  const lang = useLangStore((s) => s.lang)
  return useQuery({
    queryKey: insightsKeys.me(lang),
    queryFn: () =>
      api.get<UserAnalysisResponse>(ENDPOINTS.insights.me(lang)).then((r) => r.data),
    staleTime: 0,
    refetchOnMount: 'always',
    retry: false,
  })
}
