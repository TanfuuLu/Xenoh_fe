export interface CoachRatingResponse {
  id: string
  coachId: string
  clientId: string
  clientName: string
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string
}

export interface CoachResponse {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
  averageRating: number | null
  ratingCount: number
  myRating: CoachRatingResponse | null
  headline: string | null
  specialties: string[]
  experienceYears: number | null
  startingPrice: number | null
  currency: string
  hasContractPrices: boolean
}

export interface CoachMarketplaceProfile {
  headline: string | null
  experienceYears: number | null
  specialties: string[]
  certifications: string[]
  languages: string[]
  coachingMethods: string[]
  achievements: string[]
  clientResultsSummary: string | null
  availability: string | null
  responseTime: string | null
  coachingStyle: string | null
  monthlyPriceAmount: number | null
  sessionPriceAmount: number | null
  currency: string
}

export interface CoachProfileResponse {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
  bio: string | null
  totalClients: number
  averageRating: number | null
  ratingCount: number
  canRate: boolean
  myRating: CoachRatingResponse | null
  ratings: CoachRatingResponse[]
  marketplaceProfile: CoachMarketplaceProfile | null
}

export interface CoachRatingRequest {
  rating: number
  comment?: string | null
}
