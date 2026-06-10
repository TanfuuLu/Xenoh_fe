import { Droplet, Lock, Sparkles } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { useT } from '@/shared/i18n'
import { phaseColor } from './cycleColors'
import type { ClientCycleOverviewResponse } from '../types'

interface Props {
  overview: ClientCycleOverviewResponse
}

export function ClientCycleSummaryCard({ overview }: Props) {
  const t = useT()
  const tc = t.cycle
  const color = phaseColor(overview.currentPhase)

  // Guard against an older API response that predates the frequentSymptoms field.
  const frequentSymptoms = overview.frequentSymptoms ?? []

  // How long the menstrual phase lasts. Prefer the effective period length (always set),
  // fall back to the computed average for an older API response.
  const menstrualLengthDays = overview.effectivePeriodLengthDays ?? overview.avgPeriodLengthDays
  const menstrualLengthText = menstrualLengthDays
    ? `${menstrualLengthDays} ${tc.hero.days}`
    : '—'

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
          style={{ background: color }}
        >
          <Droplet size={17} />
        </span>
        <h2 className="text-base font-semibold text-text">{tc.coach.summaryTitle}</h2>
      </div>

      {/* Current state */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label={tc.coach.phase} value={tc.phases[overview.currentPhase]} valueColor={color} />
        <Stat label={tc.coach.cycleDay} value={overview.cycleDay?.toString() ?? '—'} />
        <Stat label={tc.coach.menstrualLength} value={menstrualLengthText} icon={<Droplet size={12} />} />
      </div>

      {/* Frequent symptoms */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
          <Sparkles size={13} style={{ color: '#a855f7' }} />
          {tc.coach.frequentSymptoms}
        </div>
        {frequentSymptoms.length === 0 ? (
          <p className="text-sm text-muted">{tc.coach.noSymptoms}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {frequentSymptoms.map((s) => (
              <span
                key={s}
                className="rounded-full border px-2.5 py-1 text-xs font-medium"
                style={{
                  background: 'color-mix(in srgb, #a855f7 12%, transparent)',
                  borderColor: 'color-mix(in srgb, #a855f7 30%, var(--border-1))',
                  color: 'var(--fg-1)',
                }}
              >
                {tc.symptoms[s] ?? s}
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="flex items-start gap-2 text-xs text-muted">
        <Lock size={13} className="mt-0.5 flex-shrink-0" />
        {tc.coach.privateNote}
      </p>
    </Card>
  )
}

function Stat({
  label,
  value,
  sub,
  valueColor,
  subColor,
  icon,
}: {
  label: string
  value: string
  sub?: string
  valueColor?: string
  subColor?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
      <p className="flex items-center gap-1 text-xs text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold" style={{ color: valueColor ?? 'var(--fg-1)' }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs" style={{ color: subColor ?? 'var(--fg-3)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}
