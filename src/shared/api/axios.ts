import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios'
import type { UserRole } from '@/shared/types/api'
import { ENDPOINTS } from './endpoints'

interface AuthRefreshResponse {
  userId: string
  accessToken: string
  email: string
  fullName: string
  avatarUrl: string | null
  roles: UserRole[]
}

let _getToken: (() => string | null) | null = null
let _setAuth: ((response: AuthRefreshResponse) => void) | null = null
let _clearAuth: (() => void) | null = null

export function initAxiosInterceptors(
  getToken: () => string | null,
  setAuth: (response: AuthRefreshResponse) => void,
  clearAuth: () => void,
) {
  _getToken = getToken
  _setAuth = setAuth
  _clearAuth = clearAuth
}

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env['VITE_API_URL'] as string,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = _getToken?.()
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(token!)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
          }
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await axios.post<AuthRefreshResponse>(
          `${import.meta.env['VITE_API_URL'] as string}${ENDPOINTS.auth.refreshToken}`,
          undefined,
          { withCredentials: true },
        )
        const { accessToken } = res.data
        _setAuth?.(res.data)
        processQueue(null, accessToken)
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        _clearAuth?.()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)
