import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { useT } from '@/shared/i18n'
import type { ExerciseSetResponse } from '../types'

interface SetRowProps {
  set: ExerciseSetResponse
  canComplete: boolean
  isCardio?: boolean
  onComplete: (setId: string, actualReps: number, actualWeight: number, rpe?: number) => void
}

export function SetRow({ set, canComplete, isCardio = false, onComplete }: SetRowProps) {
  const [reps, setReps]     = useState(String(set.plannedReps))
  const [weight, setWeight] = useState(String(set.plannedWeight ?? 0))
  const [rpe, setRpe]       = useState('')
  const t = useT()

  function handleComplete() {
    const parsedReps = Number(reps)
    const parsedWeight = Number(weight)
    const actualReps = Number.isFinite(parsedReps) && parsedReps >= 1 ? parsedReps : set.plannedReps
    const actualWeight = Number.isFinite(parsedWeight) && parsedWeight >= 0 ? parsedWeight : set.plannedWeight ?? 0
    const parsedRpe = rpe.trim() ? Number(rpe) : undefined
    const actualRpe =
      parsedRpe != null && Number.isFinite(parsedRpe) && parsedRpe >= 1 && parsedRpe <= 10
        ? parsedRpe
        : undefined

    onComplete(set.id, actualReps, actualWeight, actualRpe)
  }

  if (set.isCompleted) {
    return (
      <div
        className="flex items-center gap-2 overflow-x-auto whitespace-nowrap rounded-lg px-2 py-2.5 text-sm text-success sm:gap-3 sm:px-3"
        style={{ background: 'var(--xn-sage-200)' }}
      >
        <CheckCircle2 size={17} className="flex-shrink-0" />
        <span className="shrink-0 font-medium">Set {set.setNumber}</span>
        <span className="min-w-0 flex-1">
          {isCardio
            ? `${set.actualReps ?? set.plannedReps} min`
            : `${set.actualReps ?? set.plannedReps} reps @ ${set.actualWeight ?? set.plannedWeight ?? 0} kg`}
          {set.rpe != null && (
            <span
              className="ml-2 rounded-md px-1.5 py-0.5 text-xs font-medium"
              style={{ background: 'rgba(139,150,101,0.3)' }}
            >
              RPE {set.rpe}
            </span>
          )}
        </span>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap rounded-lg border border-border px-2 py-2 sm:gap-2 sm:px-3"
      style={{ background: 'var(--bg-1)' }}
    >
      <span className="shrink-0 text-sm font-medium text-muted">Set {set.setNumber}</span>

      {/* Reps / Duration */}
      <div className="flex shrink-0 items-center gap-1">
        <input
          type="number" min={1} max={isCardio ? 600 : 1000}
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="h-9 w-[3.5rem] rounded-md border border-border px-1.5 text-center text-sm tabular-nums text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
          style={{ background: 'var(--bg-2)' }}
        />
        <span className="text-xs text-muted">{isCardio ? 'min' : 'reps'}</span>
      </div>

      {!isCardio && (
        <>
          <span className="shrink-0 text-muted/40">@</span>

          {/* Weight */}
          <div className="flex shrink-0 items-center gap-1">
            <input
              type="number" min={0} max={10000} step={0.5}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="h-9 w-[4.75rem] rounded-md border border-border px-1.5 text-center text-sm tabular-nums text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
              style={{ background: 'var(--bg-2)' }}
            />
            <span className="text-xs text-muted">kg</span>
          </div>

          {/* RPE — optional */}
          <div className="flex shrink-0 items-center gap-1">
            <input
              type="number" min={1} max={10} step={0.5}
              value={rpe}
              placeholder="—"
              onChange={(e) => setRpe(e.target.value)}
              className="h-9 w-[3.5rem] rounded-md border border-border px-1.5 text-center text-sm tabular-nums text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
              style={{ background: 'var(--bg-2)' }}
            />
            <span className="text-xs text-muted">{t.dayWorkout.rpeLabel}</span>
          </div>
        </>
      )}

      {/* Complete button — owner only */}
      {canComplete && (
        <button
          onClick={handleComplete}
          className="ml-auto flex-shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:text-success active:scale-95"
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--xn-sage-200)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
          title="Mark done"
        >
          <Circle size={20} />
        </button>
      )}
    </div>
  )
}
