import type { CycleDayMarker, CyclePhase, FlowIntensity } from '../types'

export const PHASE_COLORS: Record<CyclePhase, string> = {
  Unknown: '#94a3b8',
  Menstrual: '#f43f5e',
  Follicular: '#22c55e',
  Ovulation: '#06b6d4',
  Luteal: '#a855f7',
}

/** Background tint used for flow days on the calendar, scaled by intensity. */
export const FLOW_FILL: Record<FlowIntensity, string> = {
  Spotting: 'rgba(244, 63, 94, 0.35)',
  Light: 'rgba(244, 63, 94, 0.55)',
  Medium: 'rgba(244, 63, 94, 0.78)',
  Heavy: 'rgba(244, 63, 94, 1)',
}

/** Lighter solid red for predicted period days (current-period continuation + future cycles). */
export const PREDICTED_PERIOD_FILL = 'rgba(244, 63, 94, 0.3)'

export function phaseColor(phase: CyclePhase): string {
  return PHASE_COLORS[phase] ?? PHASE_COLORS.Unknown
}

/** Accent + soft tint used to mark menstrual / pre-menstrual days on training plans. */
export const MARKER_STYLE: Record<CycleDayMarker, { accent: string; tint: string }> = {
  Menstrual: { accent: '#f43f5e', tint: 'rgba(244, 63, 94, 0.12)' },
  PreMenstrual: { accent: '#a855f7', tint: 'rgba(168, 85, 247, 0.12)' },
}
