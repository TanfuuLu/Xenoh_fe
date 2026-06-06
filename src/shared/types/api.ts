export type UserRole = 'Individual' | 'Coach' | 'Admin'
export type ReportReason = 'Harassment' | 'Spam' | 'Scam' | 'Inappropriate' | 'Other'
export type ReportStatus = 'Pending' | 'Resolved' | 'Dismissed'
export type DayStatus = 'Normal' | 'Rest' | 'Missed'
export type Gender = 'Male' | 'Female' | 'Other'
export const DevelopmentDirection = [
  'Strength',
  'Hypertrophy',
  'FatLoss',
  'Recomposition',
  'Endurance',
  'GeneralHealth',
] as const
export type DevelopmentDirection = (typeof DevelopmentDirection)[number]

export const TrainingDiscipline = [
  'Powerlifting',
  'Bodybuilding',
  'Weightlifting',
  'Calisthenics',
  'CrossFit',
  'Running',
  'GeneralFitness',
] as const
export type TrainingDiscipline = (typeof TrainingDiscipline)[number]

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
