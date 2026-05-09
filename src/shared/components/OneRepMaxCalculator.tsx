import { useMemo, useState } from 'react'
import { Calculator } from 'lucide-react'
import { Card } from './Card'
import { Input } from './Input'
import { Select } from './Select'
import { estimateOneRm, trainingMax, type OneRmFormula } from '@/shared/utils/oneRepMax'

interface Props {
  /** Optional title; defaults to "1RM Calculator". */
  title?: string
  /** Optional pre-filled values (handy when launched next to a logged set). */
  initialWeight?: number
  initialReps?: number
  /** Render without the outer Card (e.g. inside a panel that already has one). */
  bare?: boolean
}

const FORMULA_OPTIONS = [
  { value: 'Epley', label: 'Epley (default)' },
  { value: 'Brzycki', label: 'Brzycki' },
]

export function OneRepMaxCalculator({
  title = '1RM Calculator',
  initialWeight,
  initialReps,
  bare = false,
}: Props) {
  const [weight, setWeight] = useState<string>(initialWeight ? String(initialWeight) : '')
  const [reps, setReps] = useState<string>(initialReps ? String(initialReps) : '')
  const [formula, setFormula] = useState<OneRmFormula>('Epley')

  const e1Rm = useMemo(() => {
    const w = parseFloat(weight)
    const r = parseInt(reps, 10)
    if (Number.isNaN(w) || Number.isNaN(r)) return null
    return estimateOneRm(w, r, formula)
  }, [weight, reps, formula])

  const tm = e1Rm !== null ? trainingMax(e1Rm) : null

  const Body = (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Calculator size={17} style={{ color: 'var(--color-primary)' }} />
        <h2 className="text-base font-semibold text-text">{title}</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          label="Weight (kg)"
          type="number"
          inputMode="decimal"
          min={0}
          step={0.5}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <Input
          label="Reps"
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          step={1}
          value={reps}
          onChange={(e) => setReps(e.target.value)}
        />
        <Select
          label="Formula"
          options={FORMULA_OPTIONS}
          value={formula}
          onChange={(v) => setFormula(v as OneRmFormula)}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ResultTile label="Estimated 1RM" value={e1Rm} />
        <ResultTile label="Training max (90%)" value={tm} />
      </div>

      <p className="mt-3 text-xs text-muted">
        Estimates assume the set was taken close to failure. Brzycki is unreliable above 10 reps.
      </p>
    </>
  )

  if (bare) return <div>{Body}</div>
  return <Card>{Body}</Card>
}

function ResultTile({ label, value }: { label: string; value: number | null }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
    >
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text">
        {value === null ? '—' : `${value.toFixed(1)} kg`}
      </p>
    </div>
  )
}
