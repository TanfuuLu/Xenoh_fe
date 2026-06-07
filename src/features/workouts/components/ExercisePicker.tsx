import { memo, useCallback, useDeferredValue, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/shared/components/Badge'
import { Spinner } from '@/shared/components/Spinner'
import { Select } from '@/shared/components/Select'
import { API_BASE_URL } from '@/shared/api/baseUrl'
import { cn } from '@/shared/utils/cn'
import { useT } from '@/shared/i18n'
import { MuscleGroup, type MuscleGroup as MuscleGroupValue } from '@/shared/types/api'
import { useLocalizedExerciseName } from '../exerciseNames'
import type { ExerciseTemplateResponse } from '../types'
import { formatMuscleGroup } from './dayWorkoutHelpers'

interface ExercisePickerProps {
  templates: ExerciseTemplateResponse[]
  isLoading: boolean
  value: string
  muscleGroup: MuscleGroupValue | ''
  onMuscleGroupChange: (muscleGroup: MuscleGroupValue | '') => void
  onChange: (id: string) => void
  error?: string
}

export function ExercisePicker({
  templates,
  isLoading,
  value,
  muscleGroup,
  onMuscleGroupChange,
  onChange,
  error,
}: ExercisePickerProps) {
  const [search, setSearch] = useState('')
  const t = useT()
  const localizeName = useLocalizedExerciseName()
  const deferredSearch = useDeferredValue(search)
  const muscleGroupOptions = useMemo(
    () => Object.values(MuscleGroup).map((group) => ({ value: group, label: formatMuscleGroup(group) })),
    [],
  )

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase()
    if (!q) return templates
    return templates.filter(
      (tmpl) =>
        tmpl.name.toLowerCase().includes(q) ||
        (tmpl.description?.toLowerCase().includes(q) ?? false) ||
        tmpl.primaryMuscleGroup.toLowerCase().includes(q) ||
        tmpl.secondaryMuscleGroups.some((group) => group.toLowerCase().includes(q)),
    )
  }, [templates, deferredSearch])

  const selected = useMemo(() => templates.find((t) => t.id === value), [templates, value])
  const visibleTemplates = useMemo(() => filtered.slice(0, 40), [filtered])
  const hasMore = filtered.length > visibleTemplates.length
  const handlePick = useCallback((id: string) => onChange(id), [onChange])

  return (
    <div className="space-y-2">
      <Select
        label={t.dayWorkout.filterMuscle}
        options={muscleGroupOptions}
        placeholder={t.dayWorkout.allMuscles}
        value={muscleGroup}
        onChange={(next) => {
          onMuscleGroupChange(next as MuscleGroupValue | '')
          onChange('')
        }}
      />

      {/* Selected exercise preview */}
      {selected && (
        <div
          className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm"
          style={{ background: 'var(--xn-clay-200)', border: '1px solid var(--xn-clay-400)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 size={14} style={{ color: 'var(--xn-clay-700)', flexShrink: 0 }} />
            <span className="font-medium truncate" style={{ color: 'var(--xn-clay-800)' }}>{localizeName(selected.name)}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <span className="text-xs" style={{ color: 'var(--xn-clay-600)' }}>{selected.primaryMuscleGroup}</span>
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded p-0.5 transition-colors"
              style={{ color: 'var(--xn-clay-600)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--xn-danger)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--xn-clay-600)')}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--fg-3)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.dayWorkout.searchExercise}
          className="xn-input w-full pr-4 text-sm"
          style={{ paddingLeft: '2.75rem' }}
          autoComplete="off"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--fg-3)' }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Exercise list */}
      <div
        className="max-h-44 overflow-y-auto rounded-xl border p-1.5 space-y-0.5"
        style={{ borderColor: 'var(--border-1)', background: 'var(--bg-1)' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Spinner size="sm" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-5 text-center text-sm text-muted">{t.dayWorkout.noExerciseFound}</p>
        ) : (
          <>
            {visibleTemplates.map((tmpl) => (
              <ExerciseTemplateOption
                key={tmpl.id}
                template={tmpl}
                isSelected={tmpl.id === value}
                onPick={handlePick}
              />
            ))}
            {hasMore && (
              <p className="px-3 py-2 text-center text-xs text-muted">
                Showing {visibleTemplates.length} of {filtered.length}
              </p>
            )}
          </>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="text-xs"
            style={{ color: 'var(--xn-danger)' }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

const ExerciseTemplateOption = memo(function ExerciseTemplateOption({
  template,
  isSelected,
  onPick,
}: {
  template: ExerciseTemplateResponse
  isSelected: boolean
  onPick: (id: string) => void
}) {
  const localizeName = useLocalizedExerciseName()
  return (
    <div
      onClick={() => onPick(template.id)}
      className={cn(
        'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors select-none',
        isSelected ? 'font-medium' : 'hover:bg-white/6',
      )}
      style={isSelected ? { background: 'var(--xn-clay-200)', color: 'var(--xn-clay-800)' } : undefined}
    >
      <span className="flex min-w-0 items-center gap-2">
        {template.imageUrl && (
          <img
            src={`${API_BASE_URL}${template.imageUrl}`}
            alt={template.name}
            className="h-7 w-7 shrink-0 rounded-md object-cover"
          />
        )}
        <span className="truncate">{localizeName(template.name)}</span>
      </span>
      <span className="ml-3 flex flex-shrink-0 items-center gap-1">
        {template.isCustom && <Badge>Custom</Badge>}
        {template.exerciseKind === 'Cardio' && <Badge variant="primary">Cardio</Badge>}
        <span
          className="rounded-md px-1.5 py-0.5 text-xs"
          style={{
            background: isSelected ? 'rgba(139,100,60,0.15)' : 'var(--bg-3)',
            color: isSelected ? 'var(--xn-clay-700)' : 'var(--fg-3)',
          }}
        >
          {template.primaryMuscleGroup}
        </span>
      </span>
    </div>
  )
})
