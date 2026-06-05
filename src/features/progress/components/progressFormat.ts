import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import type { TrainingInsightResponse, TrainingInsightSeverity } from '../types'

export const MUSCLE_COLORS: Record<string, string> = {
  Chest: '#6366f1', Back: '#22c55e', Shoulders: '#f59e0b', Biceps: '#ec4899',
  Triceps: '#14b8a6', Forearms: '#8b5cf6', Quadriceps: '#f97316', Hamstrings: '#06b6d4',
  Glutes: '#e11d48', Calves: '#84cc16', Core: '#a78bfa', FullBody: '#94a3b8',
}

export const CHART_TOOLTIP_STYLE = {
  background: 'var(--bg-2)',
  border: '1px solid var(--border-1)',
  borderRadius: 8,
  fontSize: 12,
}
export const TICK_STYLE = { fill: 'var(--fg-3)', fontSize: 11 }

export function formatKg(value: number, tp: Record<string, string>) {
  return `${Math.round(value).toLocaleString()} ${tp.kgUnit}`
}

export function formatCompactKg(value: number, tp: Record<string, string>) {
  return `${Math.round(value).toLocaleString()} ${tp.kgUnit}`
}

export function translateMuscleGroup(name: string, tp: Record<string, string>) {
  const key = name.trim().toLowerCase().replace(/[\s_-]+/g, '')
  const map: Record<string, string> = {
    chest: tp.muscleChest,
    back: tp.muscleBack,
    shoulders: tp.muscleShoulders,
    shoulder: tp.muscleShoulders,
    biceps: tp.muscleBiceps,
    triceps: tp.muscleTriceps,
    quads: tp.muscleQuads,
    quadriceps: tp.muscleQuads,
    hamstrings: tp.muscleHamstrings,
    glutes: tp.muscleGlutes,
    calves: tp.muscleCalves,
    core: tp.muscleCore,
    abs: tp.muscleAbs,
    abdominals: tp.muscleAbs,
    forearms: tp.muscleForearms,
    traps: tp.muscleTraps,
    trapezius: tp.muscleTraps,
    lats: tp.muscleLats,
  }
  return map[key] ?? name
}

export function translateWeekName(name: string, tp: Record<string, string>) {
  const match = /^week\s*(\d+)$/i.exec(name.trim())
  return match ? tp.weekLabel.replace('{n}', match[1]) : name
}

export function heatmapColor(value: number, max: number) {
  if (value <= 0 || max <= 0) return 'var(--bg-3)'
  const ratio = Math.max(0, Math.min(1, value / max))
  if (ratio >= 0.86) return '#0f766e'
  if (ratio >= 0.72) return '#14b8a6'
  if (ratio >= 0.56) return '#38bdf8'
  if (ratio >= 0.40) return '#93c5fd'
  if (ratio >= 0.24) return '#bfdbfe'
  return '#dbeafe'
}

export function translateMetricLabel(label: string, tp: Record<string, string>) {
  const labels: Record<string, string> = {
    'Planned days': tp.metricPlannedDays,
    Completion: tp.completed,
    'Weeks logged': tp.metricWeeksLogged,
    'Volume change': tp.metricVolumeChange,
    'Avg RPE': tp.metricAvgRpe,
    'Warning days': tp.metricWarningDays,
    'Missing groups': tp.metricMissingGroups,
    'Top group': tp.metricTopGroup,
    'Training score': tp.trainingScore,
    'High-RPE sets': tp.metricHighRpeSets,
    'Current e1RM': tp.metricCurrentE1rm,
    'Bench / Squat': tp.metricBenchSquat,
    'Deadlift / Squat': tp.metricDeadliftSquat,
    'High-RPE weeks': tp.metricHighRpeWeeks,
  }
  return labels[label] ?? translateMuscleGroup(label, tp)
}

export function extractLiftName(title: string) {
  const match = /^(Squat|Bench|Deadlift)\b/.exec(title)
  return match?.[1] ?? title
}

export function translateLiftName(lift: string, tp: Record<string, string>) {
  if (lift === 'Squat') return tp.squat
  if (lift === 'Bench') return tp.bench
  if (lift === 'Deadlift') return tp.deadlift
  return lift
}

export function extractMissingGroups(message: string) {
  const match = /for (.+)\./i.exec(message)
  return match ? match[1].split(',').map((part) => part.trim()).filter(Boolean) : []
}

export function insightStyle(severity: TrainingInsightSeverity) {
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
    background: 'var(--bg-2)',
  }
}

export function localizeInsight(insight: TrainingInsightResponse, tp: Record<string, string>) {
  const dynamicMuscle = translateMuscleGroup(insight.metricLabel, tp)
  const dynamicLift = translateLiftName(extractLiftName(insight.title), tp)
  const missingGroups = extractMissingGroups(insight.message).map((name) => translateMuscleGroup(name, tp)).join(', ')

  const titles: Record<string, string> = {
    'No training days planned': tp.insightNoTrainingDaysTitle,
    'Consistency needs attention': tp.insightConsistencyAttentionTitle,
    'Consistency is uneven': tp.insightConsistencyUnevenTitle,
    'Strong consistency': tp.insightStrongConsistencyTitle,
    'More volume history needed': tp.insightMoreVolumeTitle,
    'Volume dropped sharply': tp.insightVolumeDroppedTitle,
    'Volume is trending down': tp.insightVolumeDownTitle,
    'Large overload jump': tp.insightLargeOverloadTitle,
    'Progressive overload is moving': tp.insightOverloadMovingTitle,
    'Volume is stable': tp.insightVolumeStableTitle,
    'Fatigue risk is elevated': tp.insightFatigueElevatedTitle,
    'Some sets missed target': tp.insightSetsMissedTitle,
    'Training is heavily concentrated': tp.insightConcentratedTitle,
    'Muscle focus is unbalanced': tp.insightFocusUnbalancedTitle,
    'Major muscle gaps detected': tp.insightMajorGapsTitle,
    'Muscle distribution looks balanced': tp.insightBalancedTitle,
    'Repeat or simplify the week': tp.insightRepeatWeekTitle,
    'Prioritize recovery': tp.insightPrioritizeRecoveryTitle,
    'Progress gradually': tp.insightProgressGraduallyTitle,
    'Hold the plan steady': tp.insightHoldSteadyTitle,
    'Bench is lagging your squat': tp.insightBenchLagTitle,
    'Deadlift is below your squat': tp.insightDeadliftLowTitle,
    'Long stretch of high-RPE work': tp.insightHighRpeStretchTitle,
  }

  const messages: Record<string, string> = {
    'No training days planned': tp.insightNoTrainingDaysMsg,
    'Consistency needs attention': tp.insightConsistencyAttentionMsg,
    'Consistency is uneven': tp.insightConsistencyUnevenMsg,
    'Strong consistency': tp.insightStrongConsistencyMsg,
    'More volume history needed': tp.insightMoreVolumeMsg,
    'Volume dropped sharply': tp.insightVolumeDroppedMsg,
    'Volume is trending down': tp.insightVolumeDownMsg,
    'Large overload jump': tp.insightLargeOverloadMsg,
    'Progressive overload is moving': tp.insightOverloadMovingMsg,
    'Volume is stable': tp.insightVolumeStableMsg,
    'Fatigue risk is elevated': tp.insightFatigueElevatedMsg,
    'Some sets missed target': tp.insightSetsMissedMsg,
    'Training is heavily concentrated': tp.insightConcentratedMsg.replace('{muscle}', dynamicMuscle),
    'Muscle focus is unbalanced': tp.insightFocusUnbalancedMsg.replace('{muscle}', dynamicMuscle),
    'Major muscle gaps detected': tp.insightMajorGapsMsg.replace('{muscles}', missingGroups || insight.message),
    'Muscle distribution looks balanced': tp.insightBalancedMsg,
    'Repeat or simplify the week': tp.insightRepeatWeekMsg,
    'Prioritize recovery': tp.insightPrioritizeRecoveryMsg,
    'Progress gradually': tp.insightProgressGraduallyMsg,
    'Hold the plan steady': tp.insightHoldSteadyMsg,
    'Bench is lagging your squat': tp.insightBenchLagMsg,
    'Deadlift is below your squat': tp.insightDeadliftLowMsg,
    'Long stretch of high-RPE work': tp.insightHighRpeStretchMsg,
  }

  const isPlateau = /^(Squat|Bench|Deadlift) is plateauing$/.test(insight.title)
  const title = isPlateau
    ? tp.insightPlateauTitle.replace('{lift}', dynamicLift)
    : titles[insight.title] ?? insight.title
  const message = isPlateau
    ? tp.insightPlateauMsg.replace('{lift}', dynamicLift)
    : messages[insight.title] ?? insight.message
  const actions: Record<string, string> = {
    'No training days planned': tp.insightNoTrainingDaysAction,
    'Consistency needs attention': tp.insightConsistencyAttentionAction,
    'Consistency is uneven': tp.insightConsistencyUnevenAction,
    'Strong consistency': tp.insightStrongConsistencyAction,
    'More volume history needed': tp.insightMoreVolumeAction,
    'Volume dropped sharply': tp.insightVolumeDroppedAction,
    'Volume is trending down': tp.insightVolumeDownAction,
    'Large overload jump': tp.insightLargeOverloadAction,
    'Progressive overload is moving': tp.insightOverloadMovingAction,
    'Volume is stable': tp.insightVolumeStableAction,
    'Fatigue risk is elevated': tp.insightFatigueElevatedAction,
    'Some sets missed target': tp.insightSetsMissedAction,
    'Training is heavily concentrated': tp.insightConcentratedAction,
    'Muscle focus is unbalanced': tp.insightFocusUnbalancedAction,
    'Major muscle gaps detected': tp.insightMajorGapsAction,
    'Muscle distribution looks balanced': tp.insightBalancedAction,
    'Repeat or simplify the week': tp.insightRepeatWeekAction,
    'Prioritize recovery': tp.insightPrioritizeRecoveryAction,
    'Progress gradually': tp.insightProgressGraduallyAction,
    'Hold the plan steady': tp.insightHoldSteadyAction,
    'Bench is lagging your squat': tp.insightBenchLagAction,
    'Deadlift is below your squat': tp.insightDeadliftLowAction,
    'Long stretch of high-RPE work': tp.insightHighRpeStretchAction,
  }
  const action = isPlateau
    ? (tp.insightPlateauAction ?? 'Hold {lift} load stable, add cleaner back-off work, and retest after the next training block.').replace('{lift}', dynamicLift)
    : actions[insight.title] ?? tp.insightDefaultAction ?? 'Use the metric above to decide the next week before changing load.'

  return {
    title,
    message,
    action,
    metricLabel: translateMetricLabel(insight.metricLabel, tp),
    metricValue: insight.metricValue.replace(/\bkg\b/g, tp.kgUnit),
  }
}
