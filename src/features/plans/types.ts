import type { PlanType } from '@/shared/types/api'

export interface PlanResponse {
  id: string
  name: string
  startDate: string
  endDate: string
  planType: PlanType
  ownerId: string
  ownerName: string
  createdByCoachId: string | null
  coachName: string | null
  totalWeeks: number
  totalDays: number
  completedDays: number
  isActive: boolean
  createdAt: string
}

export interface CoachPlanResponse {
  id: string
  name: string
  startDate: string
  endDate: string
  planType: PlanType
  ownerId: string
  ownerName: string
  ownerEmail: string
  totalWeeks: number
  createdAt: string
}

export interface CreatePlanRequest {
  name: string
  startDate: string
  endDate: string
}

export interface CreatePlanForUserRequest {
  userId: string
  name: string
  startDate: string
  endDate: string
}

export interface CreateAiStarterPlanRequest {
  goal: string
  experience: string
  daysPerWeek: number
  splitPreference: string
  sessionLengthMinutes: number
  equipment: string
  startDate: string
  endDate: string
  name?: string
  description?: string
  language?: 'en' | 'vi'
}

export interface PlanBalanceReviewResponse {
  headline: string
  severity: 'Low' | 'Medium' | 'High'
  summary: string
  warnings: string[]
  suggestions: string[]
}

export interface UpdatePlanRequest {
  name: string
  startDate: string
  endDate: string
}
