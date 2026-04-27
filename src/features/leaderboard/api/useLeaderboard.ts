import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { Big3LeaderboardEntry } from '../types'

export const leaderboardKeys = {
  big3: () => ['leaderboard', 'big3'] as const,
}

export function useLeaderboard() {
  return useQuery({
    queryKey: leaderboardKeys.big3(),
    queryFn: () =>
      api.get<Big3LeaderboardEntry[]>(ENDPOINTS.leaderboard.big3).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  })
}
