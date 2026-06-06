export interface AnalysisSection {
  headline: string
  detail: string
}

export interface AnalysisRecommendation {
  headline: string
  actions: string[]
}

export interface AnalysisPlanReview {
  headline: string
  mistakes: string[]
  suggestions: string[]
}

export interface AnalysisContent {
  trainingAdherence: AnalysisSection
  bodyMetrics: AnalysisSection
  volumeStrength: AnalysisSection
  muscleBalance: AnalysisSection
  effortGap: AnalysisSection
  recommendation: AnalysisRecommendation
  planReview?: AnalysisPlanReview | null
}

export interface AnalysisWeekComparison {
  weekNumber: number
  startDate: string
  endDate: string
  totalDays: number
  completedDays: number
  completionPercent: number
  totalExercises: number
  completedExercises: number
  volume: number
}

export interface AnalysisAdherenceMetrics {
  activePlanName: string | null
  planStartDate: string | null
  planEndDate: string | null
  totalPlanDays: number
  completedPlanDays: number
  planCompletionPercent: number
  currentWeek: AnalysisWeekComparison | null
  previousWeek: AnalysisWeekComparison | null
}

export interface AnalysisBodyweightPoint {
  date: string
  weight: number
}

export interface AnalysisBodyweightMetrics {
  points: AnalysisBodyweightPoint[]
  latestWeight: number | null
  delta: number | null
  trend: 'Unknown' | 'Up' | 'Down' | 'Stable'
}

export interface AnalysisVolumeMetrics {
  recentTotalVolume: number
  recentSetCount: number
  currentWeekVolume: number
  previousWeekVolume: number
  weekVolumeDelta: number
}

export interface AnalysisMuscleBalancePoint {
  muscle: string
  sets: number
  volume: number
  sharePercent: number
}

export interface AnalysisEffortGapPoint {
  exercise: string
  sets: number
  averageRpe: number
  pattern: string
}

export interface AnalysisEffortGapMetrics {
  highRpeMisses: AnalysisEffortGapPoint[]
  lowRpeWins: AnalysisEffortGapPoint[]
}

export interface AnalysisRecentPrEntry {
  exercise: string
  weight: number
  reps: number
  achievedAt: string
}

export interface AnalysisMetrics {
  adherence: AnalysisAdherenceMetrics
  bodyweight: AnalysisBodyweightMetrics
  volume: AnalysisVolumeMetrics
  muscleBalance: AnalysisMuscleBalancePoint[]
  effortGap: AnalysisEffortGapMetrics
  recentPrs: AnalysisRecentPrEntry[]
}

export interface UserAnalysisResponse {
  language: 'en' | 'vi'
  generatedAt: string
  cached: boolean
  content: AnalysisContent
  metrics: AnalysisMetrics
}

export type TrainingCoachTipCategory =
  | 'Technique'
  | 'Progression'
  | 'Recovery'
  | 'Adherence'
  | 'Volume'
  | 'Powerlifting'
  | 'General'

export type TrainingCoachTipConfidence = 'Low' | 'Moderate' | 'High'

export interface TrainingCoachTipResponse {
  language: 'en' | 'vi'
  generatedAt: string
  cached: boolean
  headline: string
  category: TrainingCoachTipCategory
  insight: string
  evidence: string[]
  whyItMatters: string
  nextAction: string
  confidence: TrainingCoachTipConfidence
}

export interface CoachChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface CoachChatResponse {
  reply: string
}
