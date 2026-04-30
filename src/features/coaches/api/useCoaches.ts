import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { CoachResponse, CoachProfileResponse } from '../types'

interface Filters {
  name?: string
}

export const coachKeys = {
  all: ['coaches'] as const,
  list: (name = '') => ['coaches', name] as const,
  profile: (coachId: string) => ['coaches', 'profile', coachId] as const,
}

export function useCoaches(filters?: Filters, enabled = true) {
  return useQuery({
    queryKey: coachKeys.list(filters?.name ?? ''),
    queryFn: () =>
      api
        .get<CoachResponse[]>(ENDPOINTS.coaches.list, { params: { name: filters?.name } })
        .then((r) => r.data),
    enabled,
  })
}

export function useCoachProfile(coachId: string) {
  return useQuery({
    queryKey: coachKeys.profile(coachId),
    queryFn: () =>
      api.get<CoachProfileResponse>(ENDPOINTS.coaches.profile(coachId)).then((r) => r.data),
    enabled: !!coachId,
  })
}
