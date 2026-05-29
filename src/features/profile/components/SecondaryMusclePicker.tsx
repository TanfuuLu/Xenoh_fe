import { MuscleGroup, type MuscleGroup as MuscleGroupValue } from '@/shared/types/api'
import { formatMuscleGroup } from './clientProfileHelpers'

export function SecondaryMusclePicker({
  value,
  primaryMuscleGroup,
  onChange,
  lang,
  label,
}: {
  value: MuscleGroupValue[]
  primaryMuscleGroup: MuscleGroupValue
  onChange: (value: MuscleGroupValue[]) => void
  lang: 'en' | 'vi'
  label: string
}) {
  const selected = new Set(value.filter((g) => g !== primaryMuscleGroup))

  function toggle(group: MuscleGroupValue) {
    const next = new Set(selected)
    if (next.has(group)) next.delete(group)
    else next.add(group)
    onChange([...next])
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>{label}</p>
      <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-xl border p-2" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-1)' }}>
        {Object.values(MuscleGroup)
          .filter((g) => g !== primaryMuscleGroup)
          .map((group) => {
            const isSelected = selected.has(group)
            return (
              <button
                key={group}
                type="button"
                onClick={() => toggle(group)}
                className="rounded-full border px-2.5 py-1 text-xs"
                style={{
                  borderColor: isSelected ? 'var(--xn-clay-600)' : 'var(--border-1)',
                  background: isSelected ? 'var(--xn-clay-200)' : 'var(--bg-2)',
                  color: isSelected ? 'var(--xn-clay-900)' : 'var(--fg-3)',
                }}
              >
                {formatMuscleGroup(group, lang)}
              </button>
            )
          })}
      </div>
    </div>
  )
}
