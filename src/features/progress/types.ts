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
  totalVolume: number
  primaryVolume: number
  secondaryVolume: number
  percentOfTotal: number
}

export interface MuscleGroupHeatmapWeekPoint {
  weekNumber: number
  weekName: string
  volume: number
}

export interface MuscleGroupHeatmapPoint {
  muscleGroup: string
  totalVolume: number
  weeks: MuscleGroupHeatmapWeekPoint[]
}

export interface MuscleGroupBalancePoint {
  frontVolume: number
  backVolume: number
  upperVolume: number
  lowerVolume: number
  otherVolume: number
  maxVolume: number
}

export interface PlanAnalyticsResponse {
  totalWorkoutsCompleted: number
  totalVolume: number
  consistencyPercent: number
  avgSessionsPerWeek: number
  weeklyCompliance: WeekCompliancePoint[]
  weeklyVolume: WeekVolumePoint[]
  muscleGroupVolume: MuscleGroupPoint[]
  muscleGroupHeatmap: MuscleGroupHeatmapPoint[]
  muscleGroupBalance: MuscleGroupBalancePoint
}
