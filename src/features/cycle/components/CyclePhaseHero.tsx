import { motion } from 'framer-motion'
import { Droplet, CalendarHeart, AlertCircle, Settings } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { useT } from '@/shared/i18n'
import { phaseColor } from './cycleColors'
import type { CycleOverviewResponse } from '../types'

interface Props {
  overview: CycleOverviewResponse
  onLogToday: () => void
  onOpenSettings: () => void
}

export function CyclePhaseHero({ overview, onLogToday, onOpenSettings }: Props) {
  const t = useT()
  const tc = t.cycle
  const color = phaseColor(overview.currentPhase)

  const phaseName = tc.phases[overview.currentPhase]
  const phaseDesc = tc.phaseDescriptions[overview.currentPhase]

  const nextPeriodText = (() => {
    if (overview.daysLate != null && overview.daysLate > 0) {
      return tc.hero.late.replace('{n}', String(overview.daysLate))
    }
    if (overview.daysUntilNextPeriod == null) return '—'
    if (overview.daysUntilNextPeriod === 0) return tc.hero.today
    if (overview.daysUntilNextPeriod === 1) return tc.hero.tomorrow
    return tc.hero.inDays.replace('{n}', String(overview.daysUntilNextPeriod))
  })()

  if (overview.needsData) {
    return (
      <Card className="space-y-4">
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'color-mix(in srgb, #f43f5e 14%, transparent)', color: '#f43f5e' }}
          >
            <CalendarHeart size={22} />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-text">{tc.hero.needsDataTitle}</h2>
            <p className="mt-1 text-sm text-muted">{tc.hero.needsDataBody}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onLogToday}>
            <Droplet size={15} /> {tc.hero.logToday}
          </Button>
          <Button size="sm" variant="secondary" onClick={onOpenSettings}>
            <Settings size={15} /> {tc.settings.button}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className="space-y-4"
      style={{
        borderColor: `color-mix(in srgb, ${color} 35%, var(--border-1))`,
        background: `linear-gradient(135deg, color-mix(in srgb, ${color} 12%, var(--bg-1)), var(--bg-1))`,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: color }}
          >
            <Droplet size={24} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {tc.hero.cycleDay} {overview.cycleDay ?? '—'}
            </p>
            <h2 className="text-2xl font-bold text-text">{phaseName}</h2>
            <p className="mt-0.5 max-w-md text-sm text-muted">{phaseDesc}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button size="sm" onClick={onLogToday}>
            <Droplet size={15} /> {tc.hero.logToday}
          </Button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-text"
          >
            <Settings size={13} /> {tc.settings.button}
          </button>
        </div>
      </div>

      {overview.daysLate != null && overview.daysLate > 0 && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
          style={{ background: 'var(--xn-warning-bg)', color: 'var(--xn-warning)' }}
        >
          <AlertCircle size={15} />
          {tc.hero.late.replace('{n}', String(overview.daysLate))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={tc.hero.nextPeriod} value={nextPeriodText} />
        <Stat
          label={tc.hero.avgCycle}
          value={overview.avgCycleLengthDays ? `${overview.avgCycleLengthDays} ${tc.hero.days}` : '—'}
        />
        <Stat
          label={tc.hero.avgPeriod}
          value={overview.avgPeriodLengthDays ? `${overview.avgPeriodLengthDays} ${tc.hero.days}` : '—'}
        />
        <Stat
          label={tc.hero.regular}
          value={overview.isRegular ? tc.hero.regular : tc.hero.irregular}
          valueColor={overview.isRegular ? 'var(--xn-success)' : 'var(--xn-warning)'}
        />
      </div>
    </Card>
  )
}

function Stat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border p-3"
      style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}
    >
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-bold" style={{ color: valueColor ?? 'var(--fg-1)' }}>
        {value}
      </p>
    </motion.div>
  )
}
