export interface AnalysisSection {
  headline: string
  detail: string
}

export interface AnalysisRecommendation {
  headline: string
  actions: string[]
}

export interface AnalysisContent {
  trainingAdherence: AnalysisSection
  bodyMetrics: AnalysisSection
  volumeStrength: AnalysisSection
  muscleBalance: AnalysisSection
  effortGap: AnalysisSection
  recommendation: AnalysisRecommendation
}

export interface UserAnalysisResponse {
  language: 'en' | 'vi'
  generatedAt: string
  cached: boolean
  content: AnalysisContent
}
