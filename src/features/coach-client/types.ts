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
  startDate: string
  endDate: string | null
  renewalRequestedBy: string | null
  proposedEndDate: string | null
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
  startDate: string
  endDate: string | null
  renewalRequestedBy: string | null
  proposedEndDate: string | null
}

export interface RequestCoachRequest {
  coachId: string
  startDate: string
  endDate: string
}

export interface RequestRenewalRequest {
  proposedEndDate: string
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
  activePlanId: string | null
  activePlanName: string | null
  activePlanStartDate: string | null
  activePlanEndDate: string | null
  activePlanProgressPercent: number | null
  daysSinceLastWorkout: number | null
  missedWorkoutDays: number
  completedWorkoutDays: number
  totalWorkoutDays: number
  attentionLevel: 'None' | 'Low' | 'Medium' | 'High'
  attentionReasons: string[]
}

export interface CoachClientAiBriefResponse {
  language: 'en' | 'vi'
  generatedAt: string
  cached: boolean
  headline: string
  attentionLevel: 'None' | 'Low' | 'Medium' | 'High'
  progressSummary: string
  risks: string[]
  opportunities: string[]
  suggestedMessage: string
}
