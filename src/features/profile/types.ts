import type { Gender } from '@/shared/types/api'
import type { CoachMarketplaceProfile } from '@/features/coaches'

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
  coachMarketplaceProfile: CoachMarketplaceProfile | null
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
  coachMarketplaceProfile?: CoachMarketplaceProfile
}

export interface BodyweightLogResponse {
  id: string
  weight: number
  date: string
}

export interface LogBodyweightRequest {
  weight: number
}
