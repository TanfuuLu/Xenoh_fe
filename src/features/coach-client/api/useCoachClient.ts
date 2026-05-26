import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { useLangStore } from '@/shared/i18n'
import type { ClientResponse, CoachClientAiBriefResponse, CoachClientDashboardResponse, CoachInviteCodeResponse, CoachRelationshipResponse, ConnectByCodeRequest, GenerateInviteCodeRequest, RequestRenewalRequest } from '../types'

export const coachClientKeys = {
  pendingRequests: ['coach-client', 'pending'] as const,
  myCoach: ['coach-client', 'my-coach'] as const,
  myClients: ['coach-client', 'my-clients'] as const,
  dashboard: ['coach-client', 'dashboard'] as const,
  aiBrief: (clientId: string, lang: 'en' | 'vi') => ['coach-client', clientId, 'ai-brief', lang] as const,
  inviteCodes: ['coach-client', 'invite-codes'] as const,
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

export function useMyCoach(enabled = true) {
  return useQuery({
    queryKey: coachClientKeys.myCoach,
    queryFn: () =>
      api
        .get<CoachRelationshipResponse | null>(ENDPOINTS.coachClient.myCoach)
        .then((r) => r.data),
    enabled,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    // Poll every 8s while waiting for coach to accept so client sees update without manual refresh
    refetchInterval: (query) => {
      const data = query.state.data
      if (data === null) return 10_000
      if (
        data?.status === 'Pending' ||
        data?.status === 'PendingTermination' ||
        data?.status === 'PendingRenewal'
      )
        return 8_000
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

export function useCoachClientAiBrief(clientId: string, enabled = true) {
  const lang = useLangStore((s) => s.lang)
  return useQuery({
    queryKey: coachClientKeys.aiBrief(clientId, lang),
    queryFn: () =>
      api
        .get<CoachClientAiBriefResponse>(ENDPOINTS.coachClient.aiBrief(clientId, lang))
        .then((r) => r.data),
    enabled: enabled && !!clientId,
    retry: false,
  })
}

export function useMyClients(enabled = true) {
  return useQuery({
    queryKey: coachClientKeys.myClients,
    queryFn: () =>
      api.get<ClientResponse[]>(ENDPOINTS.coachClient.myClients).then((r) => r.data),
    enabled,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
  })
}

export function useAcceptRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (relationshipId: string) =>
      api
        .put<CoachRelationshipResponse>(ENDPOINTS.coachClient.accept(relationshipId))
        .then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: coachClientKeys.pendingRequests })
      void qc.invalidateQueries({ queryKey: coachClientKeys.myClients })
      void qc.invalidateQueries({ queryKey: coachClientKeys.myCoach })
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
    },
  })
}

export function useRequestTermination() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (relationshipId: string) =>
      api.post(ENDPOINTS.coachClient.requestTermination(relationshipId)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: coachClientKeys.myCoach })
      void qc.invalidateQueries({ queryKey: coachClientKeys.myClients })
    },
  })
}

export function useAcceptTermination() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (relationshipId: string) =>
      api.post(ENDPOINTS.coachClient.acceptTermination(relationshipId)),
    onSuccess: () => {
      qc.setQueryData(coachClientKeys.myCoach, null)
      void qc.invalidateQueries({ queryKey: coachClientKeys.myCoach })
      void qc.invalidateQueries({ queryKey: coachClientKeys.myClients })
      void qc.invalidateQueries({ queryKey: coachClientKeys.pendingRequests })
    },
  })
}

export function useRejectTermination() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (relationshipId: string) =>
      api.post(ENDPOINTS.coachClient.rejectTermination(relationshipId)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: coachClientKeys.myCoach })
      void qc.invalidateQueries({ queryKey: coachClientKeys.myClients })
    },
  })
}

interface RequestRenewalArgs extends RequestRenewalRequest {
  relationshipId: string
}

export function useRequestRenewal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ relationshipId, ...body }: RequestRenewalArgs) =>
      api.post(ENDPOINTS.coachClient.requestRenewal(relationshipId), body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: coachClientKeys.myCoach })
      void qc.invalidateQueries({ queryKey: coachClientKeys.myClients })
    },
  })
}

export function useAcceptRenewal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (relationshipId: string) =>
      api.post(ENDPOINTS.coachClient.acceptRenewal(relationshipId)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: coachClientKeys.myCoach })
      void qc.invalidateQueries({ queryKey: coachClientKeys.myClients })
    },
  })
}

export function useRejectRenewal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (relationshipId: string) =>
      api.post(ENDPOINTS.coachClient.rejectRenewal(relationshipId)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: coachClientKeys.myCoach })
      void qc.invalidateQueries({ queryKey: coachClientKeys.myClients })
    },
  })
}

// ─── Invite Code hooks ───────────────────────────────────────────────────────

export function useMyInviteCodes(enabled = true) {
  return useQuery({
    queryKey: coachClientKeys.inviteCodes,
    queryFn: () =>
      api
        .get<CoachInviteCodeResponse[]>(ENDPOINTS.coachClient.inviteCodes)
        .then((r) => r.data),
    enabled,
  })
}

export function useGenerateInviteCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GenerateInviteCodeRequest) =>
      api
        .post<CoachInviteCodeResponse>(ENDPOINTS.coachClient.inviteCodes, data)
        .then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: coachClientKeys.inviteCodes })
    },
  })
}

export function useDeleteInviteCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(ENDPOINTS.coachClient.deleteInviteCode(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: coachClientKeys.inviteCodes })
    },
  })
}

export function useConnectByCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ConnectByCodeRequest) =>
      api
        .post<CoachRelationshipResponse>(ENDPOINTS.coachClient.connectByCode, data)
        .then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: coachClientKeys.myCoach })
    },
  })
}
