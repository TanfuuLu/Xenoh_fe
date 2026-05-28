import type { Gender, UserRole } from '@/shared/types/api'

export interface AuthResponse {
  userId: string
  accessToken: string
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
  gender: Extract<Gender, 'Male' | 'Female'>
  dateOfBirth: string
  height?: number
  bodyweight?: number
}

export interface RegisterResponse {
  userId: string
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export type ExternalLoginProvider = 'google' | 'facebook'

export interface ExchangeExternalLoginTicketRequest {
  ticket: string
}

export interface CompleteExternalRegistrationRequest {
  role: Extract<UserRole, 'Individual' | 'Coach'>
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface SendForgotPasswordCodeRequest {
  email: string
}

export interface ResetPasswordRequest {
  email: string
  code: string
  newPassword: string
}
