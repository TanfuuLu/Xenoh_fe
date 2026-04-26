import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { CoachResponse, CoachProfileResponse } from '../types'

interface Filters {
  name?: string
}

export function useCoaches(filters?: Filters) {
  return useQuery({
    queryKey: ['coaches', filters?.name ?? ''],
    queryFn: () =>
      api
        .get<CoachResponse[]>(ENDPOINTS.coaches.list, { params: { name: filters?.name } })
        .then((r) => r.data),
  })
}

export function useCoachProfile(coachId: string) {
  return useQuery({
    queryKey: ['coaches', 'profile', coachId] as const,
    queryFn: () =>
      api.get<CoachProfileResponse>(ENDPOINTS.coaches.profile(coachId)).then((r) => r.data),
    enabled: !!coachId,
  })
}
