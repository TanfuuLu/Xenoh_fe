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
}

export interface CoachRatingRequest {
  rating: number
  comment?: string | null
}
