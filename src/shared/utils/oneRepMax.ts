/**
 * 1RM estimators — mirrors the backend `OneRepMaxCalculator` exactly so the same
 * inputs yield the same numbers on either side of the wire.
 */

export type OneRmFormula = 'Epley' | 'Brzycki'

export const DEFAULT_TRAINING_MAX_PERCENT = 0.9

export function estimateOneRm(
  weight: number,
  reps: number,
  formula: OneRmFormula = 'Epley',
): number | null {
  if (!Number.isFinite(weight) || !Number.isFinite(reps)) return null
  if (weight <= 0 || reps <= 0) return null
  if (reps === 1) return round2(weight)

  if (formula === 'Brzycki') {
    if (reps >= 12) return null
    return round2((weight * 36) / (37 - reps))
  }

  // Epley
  return round2(weight * (1 + reps / 30))
}

export function trainingMax(e1Rm: number, pct: number = DEFAULT_TRAINING_MAX_PERCENT): number {
  return round2(e1Rm * pct)
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
