export type UserRole = 'Individual' | 'Coach' | 'Admin'
export type Gender = 'Male' | 'Female' | 'Other'
export type RelationshipStatus = 'Pending' | 'Active'
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
