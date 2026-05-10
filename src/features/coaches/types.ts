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
  startingPackagePrice: number | null
  packageCount: number
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
}

export interface CoachPackage {
  id?: string
  name: string
  priceAmount: number | null
  currency: string
  durationLabel: string
  description: string | null
  type: string | null
  displayOrder: number
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
  packages: CoachPackage[]
}

export interface CoachRatingRequest {
  rating: number
  comment?: string | null
}
