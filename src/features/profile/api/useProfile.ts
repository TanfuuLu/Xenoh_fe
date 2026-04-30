import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { useAuthStore } from '@/features/auth'
import type {
  BodyweightLogResponse,
  LogBodyweightRequest,
  PublicUserProfileResponse,
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

export function useUpdateAvatar() {
  const qc = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      return api.post<UserProfileResponse>(ENDPOINTS.users.avatar, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data)
    },
    onSuccess: (data) => {
      qc.setQueryData(profileKeys.me, data)
      setUser({
        id: data.id,
        email: data.email,
        fullName: `${data.firstName} ${data.lastName}`.trim(),
        avatarUrl: data.avatarUrl,
      })
    },
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

export function usePublicUserProfile(userId: string | null) {
  return useQuery({
    queryKey: ['profile', 'public', userId] as const,
    queryFn: () =>
      api.get<PublicUserProfileResponse>(ENDPOINTS.users.publicProfile(userId!)).then((r) => r.data),
    enabled: !!userId,
  })
}
