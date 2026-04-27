export interface Big3LeaderboardEntry {
  rank: number
  userId: string
  fullName: string
  squatPr: number | null
  benchPr: number | null
  deadliftPr: number | null
  total: number
  dotsScore: number | null
  bodyweight: number | null
}

export type Big3Lift = 'total' | 'squat' | 'bench' | 'deadlift'
