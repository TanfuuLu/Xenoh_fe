import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import type { useT } from '@/shared/i18n'
import type { ExerciseResponse } from '../types'

export const MUSCLE_COLORS: Record<string, string> = {
  Chest: '#6366f1',
  Back: '#22c55e',
  Shoulders: '#f59e0b',
  Biceps: '#ec4899',
  Triceps: '#14b8a6',
  Forearms: '#8b5cf6',
  Quadriceps: '#f97316',
  Hamstrings: '#06b6d4',
  Glutes: '#e11d48',
  Calves: '#84cc16',
  Core: '#a78bfa',
  FullBody: '#94a3b8',
}

export function calcActualVolume(exercises: ExerciseResponse[]): number {
  return exercises.reduce((total, ex) => {
    const setVol = ex.sets.reduce((s, set) => {
      if (!set.isCompleted) return s
      const reps = set.actualReps ?? set.plannedReps
      const weight = set.actualWeight ?? set.plannedWeight ?? 0
      return s + reps * weight
    }, 0)
    return total + setVol
  }, 0)
}

export function calcPlannedVolume(exercises: ExerciseResponse[]): number {
  return exercises.reduce((total, ex) => {
    return total + ex.plannedSets * ex.plannedReps * (ex.plannedWeight ?? 0)
  }, 0)
}

export function calcEstimatedCalories(exercises: ExerciseResponse[]): number {
  return exercises.reduce((total, ex) => total + (ex.estimatedCalories ?? 0), 0)
}

export function calcTotalDuration(exercises: ExerciseResponse[]): number {
  return exercises.reduce((total, ex) => total + (ex.durationSeconds ?? 0), 0)
}

export function calcAverageRpe(exercises: ExerciseResponse[]): number | null {
  const values = exercises.flatMap((ex) => ex.sets).filter((s) => s.isCompleted && s.rpe != null).map((s) => s.rpe as number)
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

export function collectMuscleGroups(exercises: ExerciseResponse[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const ex of exercises) {
    counts.set(ex.primaryMuscleGroup, (counts.get(ex.primaryMuscleGroup) ?? 0) + 1)
    for (const mg of ex.secondaryMuscleGroups) {
      counts.set(mg, (counts.get(mg) ?? 0) + 0.5)
    }
  }
  return counts
}

export function volumeBarWidth(actual: number, planned: number) {
  if (actual <= 0) return 0
  if (planned <= 0) return 100

  const displayRatio = Math.round((actual / planned) * 100)
  if (displayRatio >= 100) return 100

  return Math.max(4, Math.min(100, (actual / planned) * 100))
}

export interface WeekChartPoint {
  id: string
  day: string
  planned: number
  actual: number
  calories: number
  durationSeconds: number
  avgRpe: number | null
  completedSets: number
  totalSets: number
  isCompleted: boolean
  hasWarning: boolean
  isRest: boolean
  status: string
}

export type WeekInsightSeverity = 'Info' | 'Warning' | 'Critical' | 'Positive'

export interface WeekInsight {
  severity: WeekInsightSeverity
  title: string
  message: string
  metricLabel: string
  metricValue: string
}

type WeekAnalyzeStrings = ReturnType<typeof useT>['weekAnalyze']

export function buildWeekInsights({
  completionPct,
  volumeRatio,
  warnDays,
  missedDays,
  restDays,
  weekAverageRpe,
  muscleEntries,
  totalMuscleScore,
  ta,
}: {
  completionPct: number
  volumeRatio: number
  warnDays: number
  missedDays: number
  restDays: number
  weekAverageRpe: number | null
  muscleEntries: [string, number][]
  totalMuscleScore: number
  ta: WeekAnalyzeStrings
}): WeekInsight[] {
  const insights: WeekInsight[] = []

  if (completionPct < 50 || missedDays >= 2) {
    insights.push({
      severity: 'Critical',
      title: ta.insightRepeatTitle,
      message: ta.insightRepeatMsg,
      metricLabel: ta.completion,
      metricValue: `${completionPct}%`,
    })
  } else if (completionPct < 85 || warnDays > 0) {
    insights.push({
      severity: 'Warning',
      title: ta.insightHoldTitle,
      message: ta.insightHoldMsg,
      metricLabel: ta.warnings,
      metricValue: String(warnDays),
    })
  } else {
    insights.push({
      severity: 'Positive',
      title: ta.insightProgressTitle,
      message: ta.insightProgressMsg,
      metricLabel: ta.completion,
      metricValue: `${completionPct}%`,
    })
  }

  if (volumeRatio > 130) {
    insights.push({
      severity: 'Warning',
      title: ta.insightVolumeHighTitle,
      message: ta.insightVolumeHighMsg,
      metricLabel: ta.volumeVsPlanLabel,
      metricValue: `${volumeRatio}%`,
    })
  } else if (volumeRatio > 0 && volumeRatio < 80) {
    insights.push({
      severity: 'Warning',
      title: ta.insightVolumeLowTitle,
      message: ta.insightVolumeLowMsg,
      metricLabel: ta.volumeVsPlanLabel,
      metricValue: `${volumeRatio}%`,
    })
  }

  if (weekAverageRpe != null && weekAverageRpe >= 8.5) {
    insights.push({
      severity: 'Warning',
      title: ta.insightFatigueTitle,
      message: ta.insightFatigueMsg,
      metricLabel: ta.avgRpe,
      metricValue: weekAverageRpe.toFixed(1),
    })
  }

  const topMuscle = muscleEntries[0]
  if (topMuscle && totalMuscleScore > 0) {
    const topPercent = Math.round((topMuscle[1] / totalMuscleScore) * 100)
    if (topPercent > 45) {
      insights.push({
        severity: 'Warning',
        title: ta.insightNarrowTitle,
        message: ta.insightNarrowMsg.replace('{muscle}', topMuscle[0]),
        metricLabel: topMuscle[0],
        metricValue: `${topPercent}%`,
      })
    }
  }

  if (restDays === 0 && completionPct >= 85 && weekAverageRpe != null && weekAverageRpe >= 8) {
    insights.push({
      severity: 'Info',
      title: ta.insightRecoveryTitle,
      message: ta.insightRecoveryMsg,
      metricLabel: ta.restDaysLabel,
      metricValue: '0',
    })
  }

  return insights.slice(0, 3)
}

export function weekInsightStyle(severity: WeekInsightSeverity) {
  if (severity === 'Critical') {
    return {
      icon: AlertTriangle,
      color: 'var(--color-danger)',
      border: 'rgba(239,68,68,0.28)',
      background: 'rgba(239,68,68,0.08)',
    }
  }
  if (severity === 'Warning') {
    return {
      icon: AlertTriangle,
      color: 'var(--color-warning)',
      border: 'rgba(245,158,11,0.28)',
      background: 'rgba(245,158,11,0.08)',
    }
  }
  if (severity === 'Positive') {
    return {
      icon: CheckCircle2,
      color: 'var(--color-success)',
      border: 'rgba(34,197,94,0.25)',
      background: 'rgba(34,197,94,0.08)',
    }
  }
  return {
    icon: Info,
    color: 'var(--color-primary)',
    border: 'var(--border-1)',
    background: 'var(--bg-3)',
  }
}
