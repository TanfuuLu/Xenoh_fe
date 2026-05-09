export interface BlockedUserResponse {
  id: string
  blockedUserId: string
  fullName: string
  avatarUrl: string | null
  reason: string | null
  createdAt: string
}

export interface BlockUserRequest {
  reason?: string | null
}
