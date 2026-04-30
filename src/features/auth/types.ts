import type { UserRole } from '@/shared/types/api'

export interface AuthResponse {
  userId: string
  accessToken: string
  refreshToken: string
  email: string
  fullName: string
  avatarUrl: string | null
  roles: UserRole[]
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
}

export interface LoginRequest {
  email: string
  password: string
}
