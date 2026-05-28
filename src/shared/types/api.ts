export type UserRole = 'Individual' | 'Coach' | 'Admin'
export type ReportReason = 'Harassment' | 'Spam' | 'Scam' | 'Inappropriate' | 'Other'
export type ReportStatus = 'Pending' | 'Resolved' | 'Dismissed'
export type DayStatus = 'Normal' | 'Rest' | 'Missed'
export type Gender = 'Male' | 'Female' | 'Other'
export type RelationshipStatus =
  | 'Pending'
  | 'Active'
  | 'PendingTermination'
  | 'Expired'
  | 'PendingRenewal'
export type PlanType = 'Self' | 'Coach'

export const MuscleGroup = {
  Chest: 'Chest',
  Back: 'Back',
  Shoulders: 'Shoulders',
  Biceps: 'Biceps',
  Triceps: 'Triceps',
  Forearms: 'Forearms',
  Abs: 'Abs',
  Glutes: 'Glutes',
  Quads: 'Quads',
  Hamstrings: 'Hamstrings',
  Calves: 'Calves',
  FullBody: 'FullBody',
  Cardio: 'Cardio',
  Traps: 'Traps',
  Neck: 'Neck',
  Adductors: 'Adductors',
  Abductors: 'Abductors',
} as const

export type MuscleGroup = (typeof MuscleGroup)[keyof typeof MuscleGroup]

export interface ApiError {
  message: string
}

export interface PagedResponse<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  hasMore: boolean
}
