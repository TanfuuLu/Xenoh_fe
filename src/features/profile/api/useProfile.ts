import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { useAuthStore } from '@/features/auth'
import { dashboardKeys } from '@/features/dashboard/api/usePersonalDashboard'
import type {
  BodyweightLogResponse,
  LogBodyweightRequest,
  PublicUserProfileResponse,
  UpdatePreferencesRequest,
  UpdateProfileRequest,
  UserPreferencesResponse,
  UserProfileResponse,
} from '../types'

export const profileKeys = {
  me: ['profile', 'me'] as const,
  preferences: ['profile', 'preferences'] as const,
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
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      api.put<UserProfileResponse>(ENDPOINTS.users.me, data).then((r) => r.data),
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

export function useMyPreferences(enabled = true) {
  return useQuery({
    queryKey: profileKeys.preferences,
    queryFn: () => api.get<UserPreferencesResponse>(ENDPOINTS.users.preferences).then((r) => r.data),
    enabled,
  })
}

export function useUpdatePreferences() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdatePreferencesRequest) =>
      api.put<UserPreferencesResponse>(ENDPOINTS.users.preferences, data).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(profileKeys.preferences, data)
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
      void qc.invalidateQueries({ queryKey: dashboardKeys.personal })
    },
  })
}

export function useDeleteBodyweight() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.users.bodyweightById(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.bodyweight })
      void qc.invalidateQueries({ queryKey: profileKeys.me })
      void qc.invalidateQueries({ queryKey: dashboardKeys.personal })
    },
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
