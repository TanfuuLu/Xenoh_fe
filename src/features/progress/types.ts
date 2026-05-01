export interface WeekCompliancePoint {
  weekNumber: number
  weekName: string
  completedDays: number
  totalDays: number
}

export interface WeekVolumePoint {
  weekNumber: number
  weekName: string
  totalVolume: number
}

export interface MuscleGroupPoint {
  muscleGroup: string
  completedSets: number
}

export interface PlanAnalyticsResponse {
  totalWorkoutsCompleted: number
  totalVolume: number
  consistencyPercent: number
  avgSessionsPerWeek: number
  weeklyCompliance: WeekCompliancePoint[]
  weeklyVolume: WeekVolumePoint[]
  muscleGroupVolume: MuscleGroupPoint[]
}
