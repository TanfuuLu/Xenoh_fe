import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type {
  BodyweightLogResponse,
  LogBodyweightRequest,
  UpdateProfileRequest,
  UserProfileResponse,
} from '../types'

export const profileKeys = {
  me: ['profile', 'me'] as const,
  bodyweight: ['profile', 'bodyweight'] as const,
}

export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: () => api.get<UserProfileResponse>(ENDPOINTS.users.me).then((r) => r.data),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      api.put<UserProfileResponse>(ENDPOINTS.users.me, data).then((r) => r.data),
    onSuccess: (data) => qc.setQueryData(profileKeys.me, data),
  })
}

export function useBodyweightHistory() {
  return useQuery({
    queryKey: profileKeys.bodyweight,
    queryFn: () => api.get<BodyweightLogResponse[]>(ENDPOINTS.users.bodyweight).then((r) => r.data),
  })
}

export function useLogBodyweight() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: LogBodyweightRequest) =>
      api.post<BodyweightLogResponse>(ENDPOINTS.users.bodyweight, data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.bodyweight })
      void qc.invalidateQueries({ queryKey: profileKeys.me })
    },
  })
}

export function useDeleteBodyweight() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.users.bodyweightById(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.bodyweight }),
  })
}

export function useClientProfile(clientId: string) {
  return useQuery({
    queryKey: ['profile', 'user', clientId] as const,
    queryFn: () => api.get<UserProfileResponse>(ENDPOINTS.users.profile(clientId)).then((r) => r.data),
    enabled: !!clientId,
  })
}

export function useClientBodyweightHistory(clientId: string) {
  return useQuery({
    queryKey: ['profile', 'user', clientId, 'bodyweight'] as const,
    queryFn: () =>
      api.get<BodyweightLogResponse[]>(ENDPOINTS.users.profileBodyweight(clientId)).then((r) => r.data),
    enabled: !!clientId,
  })
}
