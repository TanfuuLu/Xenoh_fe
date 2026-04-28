import type { Gender } from '@/shared/types/api'

export interface UserProfileResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  bio: string | null
  height: number | null
  gender: Gender | null
  dateOfBirth: string | null
  currentStreak: number
  latestBodyweight: number | null
  bmi: number | null
  bmiCategory: string | null
  dotsScore: number | null
}

export interface UpdateProfileRequest {
  bio?: string
  height?: number
  gender?: Gender
  dateOfBirth?: string
}

export interface BodyweightLogResponse {
  id: string
  weight: number
  date: string
}

export interface LogBodyweightRequest {
  weight: number
}
