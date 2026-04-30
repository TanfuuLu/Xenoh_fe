import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { coachKeys } from '@/features/coaches/api/useCoaches'
import type { ClientResponse, CoachClientDashboardResponse, CoachRelationshipResponse, RequestCoachRequest } from '../types'

export const coachClientKeys = {
  pendingRequests: ['coach-client', 'pending'] as const,
  myCoach: ['coach-client', 'my-coach'] as const,
  myClients: ['coach-client', 'my-clients'] as const,
  dashboard: ['coach-client', 'dashboard'] as const,
}

export function usePendingRequests() {
  return useQuery({
    queryKey: coachClientKeys.pendingRequests,
    queryFn: () =>
      api
        .get<CoachRelationshipResponse[]>(ENDPOINTS.coachClient.pendingRequests)
        .then((r) => r.data),
  })
}

export function useMyCoach() {
  return useQuery({
    queryKey: coachClientKeys.myCoach,
    queryFn: () =>
      api
        .get<CoachRelationshipResponse | null>(ENDPOINTS.coachClient.myCoach)
        .then((r) => r.data),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    // Poll every 8s while waiting for coach to accept so client sees update without manual refresh
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.status === 'Pending') return 8_000
      return false
    },
  })
}

export function useCoachDashboard(enabled = true) {
  return useQuery({
    queryKey: coachClientKeys.dashboard,
    queryFn: () =>
      api.get<CoachClientDashboardResponse[]>(ENDPOINTS.coachClient.dashboard).then((r) => r.data),
    enabled,
  })
}

export function useMyClients(enabled = true) {
  return useQuery({
    queryKey: coachClientKeys.myClients,
    queryFn: () =>
      api.get<ClientResponse[]>(ENDPOINTS.coachClient.myClients).then((r) => r.data),
    enabled,
  })
}

export function useRequestCoach() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RequestCoachRequest) =>
      api
        .post<CoachRelationshipResponse>(ENDPOINTS.coachClient.request, data)
        .then((r) => r.data),
    onSuccess: (relationship) => {
      void qc.invalidateQueries({ queryKey: coachClientKeys.myCoach })
      void qc.invalidateQueries({ queryKey: coachKeys.all })
      void qc.invalidateQueries({ queryKey: coachKeys.profile(relationship.coachId) })
    },
  })
}

export function useAcceptRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (relationshipId: string) =>
      api
        .put<CoachRelationshipResponse>(ENDPOINTS.coachClient.accept(relationshipId))
        .then((r) => r.data),
    onSuccess: (relationship) => {
      void qc.invalidateQueries({ queryKey: coachClientKeys.pendingRequests })
      void qc.invalidateQueries({ queryKey: coachClientKeys.myClients })
      void qc.invalidateQueries({ queryKey: coachClientKeys.myCoach })
      void qc.invalidateQueries({ queryKey: coachKeys.all })
      void qc.invalidateQueries({ queryKey: coachKeys.profile(relationship.coachId) })
    },
  })
}

export function useTerminateRelationship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (relationshipId: string) =>
      api.delete(ENDPOINTS.coachClient.terminate(relationshipId)),
    onSuccess: () => {
      qc.setQueryData(coachClientKeys.myCoach, null)
      void qc.invalidateQueries({ queryKey: coachClientKeys.myCoach })
      void qc.invalidateQueries({ queryKey: coachClientKeys.myClients })
      void qc.invalidateQueries({ queryKey: coachClientKeys.pendingRequests })
      void qc.invalidateQueries({ queryKey: coachKeys.all })
    },
  })
}
