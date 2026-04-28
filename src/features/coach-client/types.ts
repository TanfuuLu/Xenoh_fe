import type { RelationshipStatus } from '@/shared/types/api'

export interface CoachRelationshipResponse {
  id: string
  clientId: string
  clientName: string
  coachId: string
  coachName: string
  status: RelationshipStatus
  createdAt: string
}

export interface ClientResponse {
  relationshipId: string
  clientId: string
  fullName: string
  email: string
  status: RelationshipStatus
  connectedAt: string
  lastWorkoutCompletedAt: string | null
}

export interface RequestCoachRequest {
  coachId: string
}
