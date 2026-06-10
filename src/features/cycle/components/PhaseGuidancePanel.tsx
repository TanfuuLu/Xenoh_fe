import { useState } from 'react'
import { Dumbbell, Apple, BookOpen } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { cn } from '@/shared/utils/cn'
import { useT } from '@/shared/i18n'
import { phaseColor } from './cycleColors'
import { PHASE_ORDER, type CyclePhase } from '../types'

interface Props {
  currentPhase: CyclePhase
}

type GuidancePhase = Exclude<CyclePhase, 'Unknown'>

export function PhaseGuidancePanel({ currentPhase }: Props) {
  const t = useT()
  const tc = t.cycle
  const initial: GuidancePhase =
    currentPhase === 'Unknown' ? 'Menstrual' : (currentPhase as GuidancePhase)
  const [active, setActive] = useState<GuidancePhase>(initial)

  const content = tc.guidance.content[active]
  const color = phaseColor(active)

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-text">
        <BookOpen size={17} style={{ color: '#f43f5e' }} />
        {tc.guidance.title}
      </div>

      <div className="flex flex-wrap gap-2">
        {PHASE_ORDER.map((phase) => {
          const isActive = phase === active
          const c = phaseColor(phase)
          return (
            <button
              key={phase}
              type="button"
              onClick={() => setActive(phase)}
              className={cn('rounded-full border px-3 py-1.5 text-sm font-medium transition-colors')}
              style={{
                background: isActive ? c : 'var(--bg-2)',
                color: isActive ? '#fff' : 'var(--fg-2)',
                borderColor: isActive ? c : 'var(--border-1)',
              }}
            >
              {tc.phases[phase]}
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <GuidanceColumn
          icon={<Dumbbell size={15} />}
          title={tc.guidance.training}
          tips={content.training}
          color={color}
        />
        <GuidanceColumn
          icon={<Apple size={15} />}
          title={tc.guidance.nutrition}
          tips={content.nutrition}
          color={color}
        />
      </div>
    </Card>
  )
}

function GuidanceColumn({
  icon,
  title,
  tips,
  color,
}: {
  icon: React.ReactNode
  title: string
  tips: readonly string[]
  color: string
}) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}>
          {icon}
        </span>
        {title}
      </div>
      <ul className="space-y-2">
        {tips.map((tip) => (
          <li key={tip} className="flex items-start gap-2 text-sm text-muted">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: color }} />
            <span className="leading-relaxed">{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
