import type { ExerciseResponse } from '../types'
import type { MuscleGroup as MuscleGroupValue } from '@/shared/types/api'

export const VALID_EXERCISE_DURATION_SECONDS = 60

export function formatDuration(seconds: number | null | undefined) {
  const total = Math.max(0, seconds ?? 0)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60

  if (hours > 0) return `${hours}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  return `${remMins}:${String(secs).padStart(2, '0')}`
}

export function hasWarningExercise(exercise: ExerciseResponse) {
  return exercise.sets.some(
    (set) =>
      set.isCompleted &&
      ((set.actualReps != null && set.actualReps < set.plannedReps) ||
        (set.actualWeight != null && set.plannedWeight != null && set.actualWeight < set.plannedWeight)),
  )
}

export function getExerciseVolume(exercise: ExerciseResponse) {
  return exercise.sets.reduce((total, set) => {
    if (!set.isCompleted) return total
    const reps = set.actualReps ?? set.plannedReps
    const weight = set.actualWeight ?? set.plannedWeight ?? 0
    return total + reps * weight
  }, 0)
}

export function formatMuscleGroup(group: MuscleGroupValue) {
  return group.replace(/([a-z])([A-Z])/g, '$1 $2')
}
