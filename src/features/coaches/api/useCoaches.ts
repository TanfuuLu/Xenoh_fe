import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { CoachResponse, CoachProfileResponse, CoachRatingRequest, CoachRatingResponse } from '../types'

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

function invalidateCoach(queryClient: ReturnType<typeof useQueryClient>, coachId: string) {
  void queryClient.invalidateQueries({ queryKey: coachKeys.profile(coachId) })
  void queryClient.invalidateQueries({ queryKey: coachKeys.all })
}

export function useCreateCoachRating(coachId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CoachRatingRequest) =>
      api.post<CoachRatingResponse>(ENDPOINTS.coaches.rating(coachId), payload).then((r) => r.data),
    onSuccess: () => invalidateCoach(queryClient, coachId),
  })
}

export function useUpdateCoachRating(coachId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CoachRatingRequest) =>
      api.put<CoachRatingResponse>(ENDPOINTS.coaches.rating(coachId), payload).then((r) => r.data),
    onSuccess: () => invalidateCoach(queryClient, coachId),
  })
}

export function useDeleteCoachRating(coachId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(ENDPOINTS.coaches.rating(coachId)),
    onSuccess: () => invalidateCoach(queryClient, coachId),
  })
}
