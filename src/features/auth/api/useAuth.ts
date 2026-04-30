import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { useAuthStore } from '../store/authStore'
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types'

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginRequest) =>
      api.post<AuthResponse>(ENDPOINTS.auth.login, data).then((r) => r.data),
    onSuccess: (data) => {
      qc.clear()
      setAuth(data.accessToken, data.refreshToken, {
        id: data.userId,
        email: data.email,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        roles: data.roles,
      })
    },
  })
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      api.post<AuthResponse>(ENDPOINTS.auth.register, data).then((r) => r.data),
    onSuccess: (data) => {
      qc.clear()
      setAuth(data.accessToken, data.refreshToken, {
        id: data.userId,
        email: data.email,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        roles: data.roles,
      })
    },
  })
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: () => api.post(ENDPOINTS.auth.logout).then(() => undefined),
    onSettled: () => {
      clear()
      qc.clear()
    },
  })
}
