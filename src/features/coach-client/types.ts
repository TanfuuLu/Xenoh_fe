import type { RelationshipStatus } from '@/shared/types/api'

export interface CoachRelationshipResponse {
  id: string
  clientId: string
  clientName: string
  clientAvatarUrl: string | null
  coachId: string
  coachName: string
  status: RelationshipStatus
  createdAt: string
  terminationRequestedBy: string | null
}

export interface ClientResponse {
  relationshipId: string
  clientId: string
  fullName: string
  email: string
  status: RelationshipStatus
  connectedAt: string
  lastWorkoutCompletedAt: string | null
  terminationRequestedBy: string | null
}

export interface RequestCoachRequest {
  coachId: string
}

export interface BigThreePRs {
  squat: number | null
  bench: number | null
  deadlift: number | null
}

export interface CoachClientDashboardResponse {
  clientId: string
  fullName: string
  email: string
  avatarUrl: string | null
  lastWorkoutDate: string | null
  planProgressPercent: number | null
  latestBodyweightKg: number | null
  bigThreePRs: BigThreePRs
}
