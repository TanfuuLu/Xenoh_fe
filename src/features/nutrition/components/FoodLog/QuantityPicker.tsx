import { useState } from 'react'
import { cn } from '@/shared/utils/cn'
import { Select } from '@/shared/components/Select'
import { useT } from '@/shared/i18n'
import type { FoodItemResponse, FoodServingResponse } from '../../types'

interface QuantityValue {
  grams?: number
  servingLabel?: string
  servingCount?: number
}

interface Props {
  food: FoodItemResponse
  onChange: (value: QuantityValue) => void
}

export function QuantityPicker({ food, onChange }: Props) {
  const t = useT()
  const hasServings = food.servings.length > 0
  const [mode, setMode] = useState<'grams' | 'serving'>(hasServings ? 'serving' : 'grams')
  const [grams, setGrams] = useState<string>('100')
  const [selectedServing, setSelectedServing] = useState<FoodServingResponse | null>(
    food.servings[0] ?? null,
  )
  const [servingCount, setServingCount] = useState<string>('1')

  const emitGrams = (val: string) => {
    const num = parseFloat(val)
    if (!isNaN(num) && num > 0) onChange({ grams: num })
  }

  const emitServing = (serving: FoodServingResponse | null, countStr: string) => {
    if (!serving) return
    const count = parseFloat(countStr)
    if (!isNaN(count) && count > 0) {
      onChange({ servingLabel: serving.label, servingCount: count })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {hasServings && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('serving')}
            className={cn('xn-chip transition-colors', mode === 'serving' ? 'accent' : 'outline')}
          >
            {t.nutrition.foodLogServing}
          </button>
          <button
            type="button"
            onClick={() => setMode('grams')}
            className={cn('xn-chip transition-colors', mode === 'grams' ? 'accent' : 'outline')}
          >
            {t.nutrition.foodLogGrams}
          </button>
        </div>
      )}

      {mode === 'grams' || !hasServings ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            step="1"
            value={grams}
            onChange={(e) => {
              setGrams(e.target.value)
              emitGrams(e.target.value)
            }}
            className="xn-input w-28 text-center"
          />
          <span className="text-sm" style={{ color: 'var(--fg-3)' }}>
            {t.nutrition.foodLogGramUnit}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0.1"
            step="0.5"
            value={servingCount}
            onChange={(e) => {
              setServingCount(e.target.value)
              emitServing(selectedServing, e.target.value)
            }}
            className="xn-input w-14 text-center"
          />
          <span className="text-sm" style={{ color: 'var(--fg-3)' }}>
            ×
          </span>
          <Select
            className="flex-1"
            options={food.servings.map((s) => ({ value: s.id, label: `${s.label} (${s.grams}g)` }))}
            value={selectedServing?.id ?? ''}
            onChange={(val) => {
              const s = food.servings.find((sv) => sv.id === val) ?? null
              setSelectedServing(s)
              emitServing(s, servingCount)
            }}
          />
        </div>
      )}
    </div>
  )
}
