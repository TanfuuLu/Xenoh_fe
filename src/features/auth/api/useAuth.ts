import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { useAuthStore } from '../store/authStore'
import type {
  AuthResponse,
  ChangePasswordRequest,
  CompleteExternalRegistrationRequest,
  ExchangeExternalLoginTicketRequest,
  ExternalLoginProvider,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SendForgotPasswordCodeRequest,
} from '../types'

const externalTicketExchangeRequests = new Map<string, Promise<AuthResponse>>()

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

export function startExternalLogin(provider: ExternalLoginProvider) {
  window.location.href = `${import.meta.env['VITE_API_URL'] as string}${ENDPOINTS.auth.externalLogin(provider)}`
}

function storeAuthResponse(
  data: AuthResponse,
  setAuth: (token: string, refreshToken: string, user: {
    id: string
    email: string
    fullName: string
    avatarUrl: string | null
    roles: AuthResponse['roles']
  }) => void,
) {
  setAuth(data.accessToken, data.refreshToken, {
    id: data.userId,
    email: data.email,
    fullName: data.fullName,
    avatarUrl: data.avatarUrl,
    roles: data.roles,
  })
}

export function useExchangeExternalLoginTicket() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: ExchangeExternalLoginTicketRequest) =>
      api.post<AuthResponse>(ENDPOINTS.auth.externalExchange, data).then((r) => r.data),
    onSuccess: (data) => {
      qc.clear()
      storeAuthResponse(data, setAuth)
    },
  })
}

export function exchangeExternalLoginTicketOnce(data: ExchangeExternalLoginTicketRequest) {
  const existingRequest = externalTicketExchangeRequests.get(data.ticket)
  if (existingRequest) return existingRequest

  const request = api
    .post<AuthResponse>(ENDPOINTS.auth.externalExchange, data)
    .then((r) => {
      storeAuthResponse(r.data, useAuthStore.getState().setAuth)
      return r.data
    })
    .finally(() => {
      externalTicketExchangeRequests.delete(data.ticket)
    })

  externalTicketExchangeRequests.set(data.ticket, request)
  return request
}

export function useCompleteExternalRegistration() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: CompleteExternalRegistrationRequest) =>
      api.post<AuthResponse>(ENDPOINTS.auth.externalCompleteRegistration, data).then((r) => r.data),
    onSuccess: (data) => {
      qc.clear()
      storeAuthResponse(data, setAuth)
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

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) =>
      api.post(ENDPOINTS.auth.changePassword, data).then(() => undefined),
  })
}

export function useSendForgotPasswordCode() {
  return useMutation({
    mutationFn: (data: SendForgotPasswordCodeRequest) =>
      api.post(ENDPOINTS.auth.forgotPasswordSendCode, data).then(() => undefined),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) =>
      api.post(ENDPOINTS.auth.forgotPasswordReset, data).then(() => undefined),
  })
}
