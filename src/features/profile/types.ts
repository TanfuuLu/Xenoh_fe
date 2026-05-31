import type { Gender } from '@/shared/types/api'
import type { Lang } from '@/shared/i18n'
import type { Theme } from '@/shared/theme'
import type { WeightUnit } from '@/shared/preferences'

export interface UserPreferencesResponse {
  language: Lang
  theme: Theme
  weightUnit: WeightUnit
}

export interface UpdatePreferencesRequest {
  language: Lang
  theme: Theme
  weightUnit: WeightUnit
}

export interface UserProfileResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  bio: string | null
  height: number | null
  gender: Gender | null
  dateOfBirth: string | null
  currentStreak: number
  latestBodyweight: number | null
  bmi: number | null
  bmiCategory: string | null
  dotsScore: number | null
  level: number
  totalXp: number
  xpToNextLevel: number
  title: string
  facebookUrl: string | null
  instagramUrl: string | null
  zaloUrl: string | null
}

export interface TrainingActivityResponse {
  totalDurationSeconds: number
  totalWeightTrainedKg: number
  accountCreatedAt: string
  year: number
  month: number
  trainedDates: string[]
}

export interface PublicUserProfileResponse {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
  bio: string | null
  gender: string | null
  height: number | null
  latestBodyweight: number | null
  bmi: number | null
  bmiCategory: string | null
  currentStreak: number
  dotsScore: number | null
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  bio?: string
  height?: number
  gender?: Gender
  dateOfBirth?: string
  facebookUrl?: string
  instagramUrl?: string
  zaloUrl?: string
}

export interface BodyweightLogResponse {
  id: string
  weight: number
  date: string
}

export interface LogBodyweightRequest {
  weight: number
}
