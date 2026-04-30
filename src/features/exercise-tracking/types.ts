export interface ExercisePrResponse {
  exerciseTemplateId: string
  exerciseName: string
  currentWeight: number
  reps: number
  achievedAt: string
}

export interface ExercisePrHistoryPointResponse {
  exerciseTemplateId: string
  weight: number
  reps: number
  achievedAt: string
}
