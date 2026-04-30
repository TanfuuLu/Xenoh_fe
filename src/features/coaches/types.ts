export interface CoachResponse {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
}

export interface CoachProfileResponse {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
  totalClients: number
}
