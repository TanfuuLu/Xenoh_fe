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
  trainingScore: number
  insights: TrainingInsightResponse[]
  weeklyCompliance: WeekCompliancePoint[]
  weeklyVolume: WeekVolumePoint[]
  muscleGroupVolume: MuscleGroupPoint[]
  muscleGroupHeatmap: MuscleGroupHeatmapPoint[]
  muscleGroupBalance: MuscleGroupBalancePoint
  /** Present only when the plan contains exercises flagged as competition lifts. */
  powerlifting: PowerliftingSection | null
}

export type TrainingInsightSeverity = 'Info' | 'Warning' | 'Critical' | 'Positive'

export type TrainingInsightType =
  | 'Consistency'
  | 'VolumeTrend'
  | 'Overload'
  | 'FatigueRisk'
  | 'MuscleBalance'
  | 'Recommendation'
  | 'PowerliftingPlateau'
  | 'PowerliftingImbalance'
  | 'PowerliftingDeload'

export interface TrainingInsightResponse {
  type: TrainingInsightType
  severity: TrainingInsightSeverity
  title: string
  message: string
  metricLabel: string
  metricValue: string
}

export type CompetitionLift = 'Squat' | 'Bench' | 'Deadlift'

export interface LiftE1RmPoint {
  weekStart: string
  e1Rm: number
}

export interface LiftPrEvent {
  date: string
  weight: number
  reps: number
  e1Rm: number
}

export interface LiftSeries {
  lift: CompetitionLift
  e1Rm: LiftE1RmPoint[]
  prTimeline: LiftPrEvent[]
  currentE1Rm: number | null
  currentTrainingMax: number | null
  isPlateau: boolean
}

export interface DotsOverTimePoint {
  weekStart: string
  dots: number
  bodyweightKg: number
}

export interface PowerliftingSection {
  squat: LiftSeries
  bench: LiftSeries
  deadlift: LiftSeries
  dots: DotsOverTimePoint[]
}

export interface ClientPowerliftingResponse {
  clientId: string
  powerlifting: PowerliftingSection | null
  insights: TrainingInsightResponse[]
}
