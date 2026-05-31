import { useEffect, useState } from 'react'
import { Timer, Flame, Play, Square, Check } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { useT } from '@/shared/i18n'
import { useMyProfile } from '@/features/profile'
import type { ExerciseResponse } from '../types'
import { formatDuration } from './dayWorkoutHelpers'

export function ExerciseTimerControls({
  exercise,
  canComplete,
  pending,
  onStart,
  onFinish,
  onSetDuration,
}: {
  exercise: ExerciseResponse
  canComplete: boolean
  pending: boolean
  onStart: () => void
  onFinish: () => void
  onSetDuration: (durationSeconds: number) => void
}) {
  const [now, setNow] = useState(() => Date.now())
  const isRunning = exercise.startedAtUtc != null && exercise.endedAtUtc == null
  const showManualInput = exercise.isCompleted && exercise.startedAtUtc == null

  const storageKey = `xn-duration-${exercise.id}`
  const [mins, setMins] = useState(() => {
    const stored = localStorage.getItem(storageKey)
    return stored ? stored.split(':')[0] : ''
  })
  const [secs, setSecs] = useState(() => {
    const stored = localStorage.getItem(storageKey)
    return stored ? stored.split(':')[1] : ''
  })
  const [saved, setSaved] = useState(() => !!localStorage.getItem(storageKey))

  const { data: profile } = useMyProfile()

  useEffect(() => {
    if (!isRunning) return undefined
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [isRunning])

  const manualSeconds = (parseInt(mins, 10) || 0) * 60 + (parseInt(secs, 10) || 0)
  const elapsedSeconds = isRunning && exercise.startedAtUtc
    ? Math.max(0, Math.floor((now - new Date(exercise.startedAtUtc).getTime()) / 1000))
    : (exercise.durationSeconds ?? (showManualInput && saved ? manualSeconds : 0))

  const { dayWorkout: tdw } = useT()
  const caloriesText = (() => {
    if (exercise.estimatedCalories != null) return `${Math.round(exercise.estimatedCalories)} kcal`
    if (exercise.calorieEstimateStatus === 'MissingBodyweight') return tdw.missingBodyweight
    if (showManualInput && saved && manualSeconds > 0) {
      const bw = profile?.latestBodyweight
      if (!bw) return tdw.missingBodyweight
      const kcal = exercise.estimatedMet * bw * (manualSeconds / 3600)
      return `~${Math.round(kcal)} kcal`
    }
    return tdw.noEstimate
  })()

  function handleSave() {
    if (manualSeconds <= 0) return
    const m = String(parseInt(mins, 10) || 0).padStart(2, '0')
    const s = String(Math.min(59, parseInt(secs, 10) || 0)).padStart(2, '0')
    localStorage.setItem(storageKey, `${m}:${s}`)
    onSetDuration(manualSeconds)
    setSaved(true)
  }

  return (
    <div
      className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
      style={{ borderColor: 'var(--border-1)', background: exercise.exerciseKind === 'Cardio' ? 'rgba(20,184,166,0.08)' : 'var(--bg-1)' }}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium text-text">
          <Timer size={15} /> {formatDuration(elapsedSeconds)}
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5 text-muted">
          <Flame size={14} /> {caloriesText}
        </span>
      </div>

      {canComplete && (
        <div className="flex shrink-0 items-center justify-end gap-1.5">
          {showManualInput ? (
            <>
              <div className="flex items-center gap-1 text-sm">
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={mins}
                  onChange={(e) => { setMins(e.target.value); setSaved(false) }}
                  className="w-11 rounded-md border bg-transparent px-1 py-0.5 text-center font-medium text-text outline-none focus:ring-1 focus:ring-primary/50"
                  style={{ borderColor: 'var(--border-1)' }}
                  placeholder="00"
                />
                <span className="font-medium text-muted">:</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={secs}
                  onChange={(e) => { setSecs(e.target.value); setSaved(false) }}
                  className="w-11 rounded-md border bg-transparent px-1 py-0.5 text-center font-medium text-text outline-none focus:ring-1 focus:ring-primary/50"
                  style={{ borderColor: 'var(--border-1)' }}
                  placeholder="00"
                />
                <span className="ml-0.5 text-xs text-muted">m:s</span>
              </div>
              <button
                type="button"
                onClick={handleSave}
                className="flex h-7 w-7 items-center justify-center rounded-md border transition-colors"
                style={saved
                  ? { borderColor: 'var(--color-success)', background: 'rgba(34,197,94,0.15)', color: 'var(--color-success)' }
                  : { borderColor: 'var(--border-1)', background: 'var(--bg-3)', color: 'var(--fg-2)' }
                }
              >
                <Check size={14} />
              </button>
            </>
          ) : exercise.startedAtUtc == null ? (
            <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={onStart}>
              <Play size={14} /> {tdw.startTimer}
            </Button>
          ) : exercise.endedAtUtc == null ? (
            <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={onFinish}>
              <Square size={14} /> {tdw.endTimer}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  )
}
