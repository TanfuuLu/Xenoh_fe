import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { cn } from '@/shared/utils/cn'
import { useT } from '@/shared/i18n'
import { useDeleteCycleLog, useUpsertCycleLog } from '../api/useCycle'
import {
  FLOW_OPTIONS,
  MOOD_OPTIONS,
  SYMPTOM_OPTIONS,
  type CycleDailyLogResponse,
  type CycleMood,
  type CycleSymptom,
  type FlowIntensity,
} from '../types'

interface Props {
  open: boolean
  date: string | null
  log: CycleDailyLogResponse | undefined
  onClose: () => void
}

export function CycleDayLogModal({ open, date, log, onClose }: Props) {
  const t = useT()
  const tc = t.cycle
  const upsert = useUpsertCycleLog()
  const remove = useDeleteCycleLog()

  const [flow, setFlow] = useState<FlowIntensity | null>(null)
  const [symptoms, setSymptoms] = useState<CycleSymptom[]>([])
  const [mood, setMood] = useState<CycleMood | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setFlow(log?.flow ?? null)
    setSymptoms(log?.symptoms ?? [])
    setMood(log?.mood ?? null)
    setEnergy(log?.energyLevel ?? null)
    setNotes(log?.notes ?? '')
  }, [open, log])

  if (!date) return null

  const title = tc.log.titleNew.replace('{date}', format(parseISO(date), 'd MMM yyyy'))
  const hasExisting = !!log

  function toggleSymptom(s: CycleSymptom) {
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  function handleSave() {
    if (!date) return
    upsert.mutate(
      {
        date,
        data: {
          flow,
          symptoms,
          mood,
          energyLevel: energy,
          notes: notes.trim() || null,
        },
      },
      { onSuccess: onClose },
    )
  }

  function handleDelete() {
    if (!date) return
    remove.mutate(date, { onSuccess: onClose })
  }

  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-lg">
      <div className="space-y-5">
        {/* Flow */}
        <Field label={tc.flowLabel}>
          <div className="flex flex-wrap gap-2">
            <Chip active={flow === null} onClick={() => setFlow(null)}>
              {tc.log.none}
            </Chip>
            {FLOW_OPTIONS.map((f) => (
              <Chip key={f} active={flow === f} onClick={() => setFlow(f)} accent="#f43f5e">
                {tc.flow[f]}
              </Chip>
            ))}
          </div>
        </Field>

        {/* Symptoms */}
        <Field label={tc.symptomsLabel}>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_OPTIONS.map((s) => (
              <Chip key={s} active={symptoms.includes(s)} onClick={() => toggleSymptom(s)} accent="#a855f7">
                {tc.symptoms[s]}
              </Chip>
            ))}
          </div>
        </Field>

        {/* Mood */}
        <Field label={tc.moodLabel}>
          <div className="flex flex-wrap gap-2">
            <Chip active={mood === null} onClick={() => setMood(null)}>
              {tc.log.none}
            </Chip>
            {MOOD_OPTIONS.map((m) => (
              <Chip key={m} active={mood === m} onClick={() => setMood(m)} accent="#06b6d4">
                {tc.moods[m]}
              </Chip>
            ))}
          </div>
        </Field>

        {/* Energy */}
        <Field label={tc.energyLabel}>
          <div className="flex gap-2">
            <Chip active={energy === null} onClick={() => setEnergy(null)}>
              {tc.log.none}
            </Chip>
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip key={n} active={energy === n} onClick={() => setEnergy(n)} accent="#22c55e">
                {n}
              </Chip>
            ))}
          </div>
        </Field>

        {/* Notes */}
        <Field label={tc.notesLabel}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={tc.notesPlaceholder}
            maxLength={500}
            rows={3}
            className="xn-input w-full resize-none"
          />
        </Field>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          {hasExisting ? (
            <Button variant="ghost" size="sm" onClick={handleDelete} loading={remove.isPending}>
              <Trash2 size={14} /> {tc.log.delete}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1 sm:flex-none" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={handleSave} loading={upsert.isPending}>
              {tc.log.save}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function Chip({
  active,
  onClick,
  accent,
  children,
}: {
  active: boolean
  onClick: () => void
  accent?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('rounded-full border px-3 py-1.5 text-sm font-medium transition-colors')}
      style={{
        background: active ? (accent ?? 'var(--accent, #6366f1)') : 'var(--bg-2)',
        color: active ? '#fff' : 'var(--fg-2)',
        borderColor: active ? (accent ?? 'var(--accent, #6366f1)') : 'var(--border-1)',
      }}
    >
      {children}
    </button>
  )
}
