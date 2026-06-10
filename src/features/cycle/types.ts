export type CyclePhase = 'Unknown' | 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal'
export type FlowIntensity = 'Spotting' | 'Light' | 'Medium' | 'Heavy'
export type CycleMood = 'Great' | 'Good' | 'Neutral' | 'Low' | 'Irritable'
export type CycleSymptom =
  | 'Cramps'
  | 'Headache'
  | 'Bloating'
  | 'BreastTenderness'
  | 'Fatigue'
  | 'BackPain'
  | 'Nausea'
  | 'Acne'
  | 'Cravings'
  | 'Insomnia'
  | 'MoodSwings'

export const FLOW_OPTIONS: FlowIntensity[] = ['Spotting', 'Light', 'Medium', 'Heavy']
export const MOOD_OPTIONS: CycleMood[] = ['Great', 'Good', 'Neutral', 'Low', 'Irritable']
export const SYMPTOM_OPTIONS: CycleSymptom[] = [
  'Cramps',
  'Headache',
  'Bloating',
  'BreastTenderness',
  'Fatigue',
  'BackPain',
  'Nausea',
  'Acne',
  'Cravings',
  'Insomnia',
  'MoodSwings',
]
export const PHASE_ORDER: Exclude<CyclePhase, 'Unknown'>[] = [
  'Menstrual',
  'Follicular',
  'Ovulation',
  'Luteal',
]

export interface CycleDailyLogResponse {
  date: string
  flow: FlowIntensity | null
  symptoms: CycleSymptom[]
  mood: CycleMood | null
  energyLevel: number | null
  notes: string | null
}

export interface UpsertCycleLogRequest {
  flow?: FlowIntensity | null
  symptoms?: CycleSymptom[]
  mood?: CycleMood | null
  energyLevel?: number | null
  notes?: string | null
}

export interface PredictedPeriod {
  start: string
  end: string
}

export interface FertileWindow {
  start: string
  end: string
}

export interface CycleOverviewResponse {
  currentPhase: CyclePhase
  cycleDay: number | null
  daysUntilNextPeriod: number | null
  daysLate: number | null
  lastPeriodStart: string | null
  nextPeriodStart: string | null
  predictedPeriods: PredictedPeriod[]
  ovulationDates: string[]
  fertileWindows: FertileWindow[]
  effectiveCycleLengthDays: number
  effectivePeriodLengthDays: number
  avgCycleLengthDays: number | null
  avgPeriodLengthDays: number | null
  isRegular: boolean
  cycleVariabilityDays: number | null
  confidence: string
  needsData: boolean
}

export interface CycleSettingsResponse {
  averageCycleLengthOverride: number | null
  averagePeriodLengthOverride: number | null
  shareWithCoach: boolean
}

export interface UpdateCycleSettingsRequest {
  averageCycleLengthOverride: number | null
  averagePeriodLengthOverride: number | null
  shareWithCoach: boolean
}

export interface ClientCycleOverviewResponse {
  currentPhase: CyclePhase
  cycleDay: number | null
  nextPeriodStart: string | null
  daysUntilNextPeriod: number | null
  daysLate: number | null
  effectiveCycleLengthDays: number
  effectivePeriodLengthDays: number
  avgCycleLengthDays: number | null
  avgPeriodLengthDays: number | null
  isRegular: boolean
  cycleVariabilityDays: number | null
  lastPeriodStart: string | null
  nextOvulationDate: string | null
  fertileWindowStart: string | null
  fertileWindowEnd: string | null
  frequentSymptoms: CycleSymptom[]
  confidence: string
  needsData: boolean
}

export interface CycleInsightPhaseRecommendation {
  phase: string
  training: string
  nutrition: string
}

export interface CycleInsightContent {
  summary: string
  cyclePatterns: string[]
  symptomPatterns: string[]
  trainingCorrelations: string[]
  phaseRecommendations: CycleInsightPhaseRecommendation[]
  cautions: string[]
  disclaimer: string
}

export interface CycleInsightResponse {
  language: 'en' | 'vi'
  generatedAt: string
  cached: boolean
  content: CycleInsightContent
}
