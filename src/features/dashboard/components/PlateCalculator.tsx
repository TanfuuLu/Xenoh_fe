import { Input } from '@/shared/components/Input'
import { useT } from '@/shared/i18n'

export interface PlateCalculatorResult {
  kg: number | null
  lbs: number | null
  kgLoad: PlateLoadResult | null
  lbsLoad: PlateLoadResult | null
}

interface PlateLoadResult {
  totalLoadedWeight: number
  plates: Array<{ weight: number; count: number }>
  remainder: number
}

const KG_TO_LBS = 2.2046226218
const BAR_KG = 20
const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]
const LB_PLATES = [55, 45, 35, 25, 10, 5, 2.5]

export function getPlateCalculator(value: number, unit: 'kg' | 'lbs'): PlateCalculatorResult {
  if (!Number.isFinite(value) || value <= 0) {
    return { kg: null, lbs: null, kgLoad: null, lbsLoad: null }
  }

  const kg = unit === 'kg' ? value : value / KG_TO_LBS
  const lbs = unit === 'lbs' ? value : value * KG_TO_LBS

  return {
    kg,
    lbs,
    kgLoad: getPlateLoad(kg, BAR_KG, KG_PLATES),
    lbsLoad: getPlateLoad(lbs, BAR_KG * KG_TO_LBS, LB_PLATES),
  }
}

function getPlateLoad(totalWeight: number, barWeight: number, plates: number[]): PlateLoadResult | null {
  if (totalWeight < barWeight) return null

  let remainingPerSide = (totalWeight - barWeight) / 2
  const loadedPlates: Array<{ weight: number; count: number }> = []

  for (const plate of plates) {
    const count = Math.floor((remainingPerSide + 0.0001) / plate)
    if (count > 0) {
      loadedPlates.push({ weight: plate, count })
      remainingPerSide -= count * plate
    }
  }

  const loadedPerSide = loadedPlates.reduce((sum, plate) => sum + plate.weight * plate.count, 0)

  return {
    totalLoadedWeight: barWeight + loadedPerSide * 2,
    plates: loadedPlates,
    remainder: Math.max(0, remainingPerSide),
  }
}

export function PlateCalculatorBody({
  input,
  onInputChange,
  calculator,
}: {
  input: { value: string; unit: 'kg' | 'lbs' }
  onInputChange: (input: { value: string; unit: 'kg' | 'lbs' }) => void
  calculator: PlateCalculatorResult
}) {
  const td = useT().dashboard
  const kgValue = input.unit === 'kg' ? input.value : calculator.kg ? roundDisplay(calculator.kg) : ''
  const lbsValue = input.unit === 'lbs' ? input.value : calculator.lbs ? roundDisplay(calculator.lbs) : ''

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{td.plateCalculatorHint}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={td.kilograms}
          type="number"
          min="0"
          step="0.5"
          value={kgValue}
          onChange={(event) => onInputChange({ value: event.target.value, unit: 'kg' })}
        />
        <Input
          label={td.pounds}
          type="number"
          min="0"
          step="1"
          value={lbsValue}
          onChange={(event) => onInputChange({ value: event.target.value, unit: 'lbs' })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PlateLoadPanel title={td.kgPlates} unit="kg" barLabel={td.kgBar} load={calculator.kgLoad} />
        <PlateLoadPanel title={td.lbPlates} unit="lb" barLabel={td.lbBar.replace('{n}', roundDisplay(BAR_KG * KG_TO_LBS))} load={calculator.lbsLoad} />
      </div>
    </div>
  )
}

function PlateLoadPanel({
  title,
  unit,
  barLabel,
  load,
}: {
  title: string
  unit: string
  barLabel: string
  load: PlateLoadResult | null
}) {
  const td = useT().dashboard
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">{title}</p>
          <p className="text-xs text-muted">{barLabel}</p>
        </div>
        {load && <p className="text-sm font-semibold text-text">{roundDisplay(load.totalLoadedWeight)} {unit}</p>}
      </div>

      {!load ? (
        <p className="text-sm text-muted">{td.enterAboveBar}</p>
      ) : load.plates.length === 0 ? (
        <p className="text-sm text-muted">{td.barOnly}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {load.plates.map((plate) => (
            <span
              key={`${unit}-${plate.weight}`}
              className="rounded-full px-3 py-1 text-sm font-medium"
              style={{ background: 'var(--bg-3)', color: 'var(--fg-1)' }}
            >
              {plate.count}x {plate.weight}{unit}
            </span>
          ))}
        </div>
      )}

      {load && load.remainder > 0.01 && (
        <p className="mt-3 text-xs text-muted">
          {td.nearestLoad.replace('{n}', roundDisplay(load.remainder)).replace('{unit}', unit)}
        </p>
      )}
    </div>
  )
}

function roundDisplay(value: number) {
  return Number(value.toFixed(2)).toString()
}
