import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Search, Trophy } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format, isValid } from 'date-fns'
import { Card } from '@/shared/components/Card'
import { Input } from '@/shared/components/Input'
import { Spinner } from '@/shared/components/Spinner'
import { cn } from '@/shared/utils/cn'
import { slideUp } from '@/shared/utils/motion'
import type { ExercisePrResponse } from '../types'
import { RequireTier } from '@/features/billing/components/RequireTier'
import { useExercisePrHistory, useExercisePrs } from '../index'
import { SharePrButton } from '../components/SharePrButton'
import { useAuthStore } from '@/features/auth'

function formatDate(value: string | null | undefined, pattern = 'dd/MM/yyyy') {
  if (!value) return '-'
  const date = new Date(value)
  return isValid(date) ? format(date, pattern) : '-'
}

export function ExerciseTrackingPage() {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const { data: prs, isLoading: loadingPrs } = useExercisePrs()
  const selectedId = selectedExerciseId || null
  const { data: history, isLoading: loadingHistory } = useExercisePrHistory(selectedId)
  const userId = useAuthStore((s) => s.user?.id)

  const exercises = useMemo(() => (Array.isArray(prs) ? prs : []), [prs])

  const selectedPr = exercises.find((pr) => pr.exerciseTemplateId === selectedExerciseId)

  const filteredExercises = useMemo(
    () =>
      exercises.filter((pr) =>
        pr.exerciseName.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [exercises, search],
  )

  const chartData = (history ?? []).map((point) => ({
    date: formatDate(point.achievedAt, 'dd/MM'),
    fullDate: formatDate(point.achievedAt),
    weight: point.weight,
    reps: point.reps,
  }))

  if (loadingPrs) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <RequireTier feature="Exercise Tracking & Personal Records">
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Exercise Tracking</h1>
        <p className="mt-1 text-sm text-muted">Track your best weight PR progress over time.</p>
      </div>

      {exercises.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: 'var(--bg-3)', color: 'var(--xn-clay-700)' }}
            >
              <Trophy size={22} />
            </div>
            <h2 className="text-lg font-semibold text-text">No PRs yet</h2>
            <p className="mt-2 max-w-md text-sm text-muted">
              Complete a weighted set to create your first exercise PR.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <ExerciseSearchBox
              label="Exercise"
              search={search}
              open={searchOpen}
              exercises={filteredExercises}
              selectedExerciseId={selectedExerciseId}
              onSearchChange={(value) => {
                setSearch(value)
                setSearchOpen(true)
              }}
              onOpenChange={setSearchOpen}
              onSelect={(exercise) => {
                setSelectedExerciseId(exercise.exerciseTemplateId)
                setSearch(exercise.exerciseName)
                setSearchOpen(false)
              }}
              placeholder="Select exercise..."
            />
          </Card>

          {selectedPr && (
            <Card>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="grid gap-4 sm:grid-cols-4">
                  <SummaryStat label="Exercise" value={selectedPr.exerciseName} />
                  <SummaryStat label="Current PR" value={`${selectedPr.currentWeight} kg`} />
                  <SummaryStat label="Reps" value={`${selectedPr.reps}`} />
                  <SummaryStat label="Achieved" value={formatDate(selectedPr.achievedAt)} />
                </div>
                {userId && (
                  <SharePrButton
                    userId={userId}
                    exerciseTemplateId={selectedPr.exerciseTemplateId}
                    exerciseName={selectedPr.exerciseName}
                  />
                )}
              </div>
            </Card>
          )}

          {selectedPr && <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-text">PR Progress</h2>
              <p className="text-sm text-muted">Best weight by achieved date</p>
            </div>

            {loadingHistory ? (
              <div className="flex h-56 items-center justify-center">
                <Spinner />
              </div>
            ) : chartData.length > 0 ? (
              <motion.div initial="hidden" animate="visible" variants={slideUp} className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--fg-3)', fontSize: 11 }} />
                    <YAxis
                      tick={{ fill: 'var(--fg-3)', fontSize: 11 }}
                      domain={['auto', 'auto']}
                      width={44}
                    />
                    <Tooltip
                      formatter={(value, name, item) => [
                        `${value} kg (${item.payload.reps} reps)`,
                        name,
                      ]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ''}
                      contentStyle={{
                        background: 'var(--bg-2)',
                        border: '1px solid var(--border-1)',
                        borderRadius: 8,
                      }}
                      labelStyle={{ color: 'var(--fg-1)' }}
                      itemStyle={{ color: 'var(--xn-clay-700)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Weight"
                      stroke="var(--xn-clay-700)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--xn-clay-700)', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            ) : (
              <p className="text-sm text-muted">No PR history found for this exercise.</p>
            )}
          </Card>}
        </>
      )}
    </div>
  </RequireTier>
  )
}

function ExerciseSearchBox({
  label,
  search,
  open,
  exercises,
  selectedExerciseId,
  placeholder,
  onSearchChange,
  onOpenChange,
  onSelect,
}: {
  label: string
  search: string
  open: boolean
  exercises: ExercisePrResponse[]
  selectedExerciseId: string
  placeholder: string
  onSearchChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onSelect: (exercise: ExercisePrResponse) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [onOpenChange, open])

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      onOpenChange(false)
      return
    }

    if (event.key === 'Enter' && exercises[0]) {
      event.preventDefault()
      onSelect(exercises[0])
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        label={label}
        leftIcon={<Search size={16} />}
        value={search}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => onOpenChange(true)}
        onChange={(event) => onSearchChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.975 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.975 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border"
            style={{
              background: 'var(--bg-3)',
              borderColor: 'var(--border-1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            <div className="max-h-64 overflow-y-auto p-1.5">
              {exercises.length > 0 ? (
                exercises.map((exercise) => {
                  const selected = exercise.exerciseTemplateId === selectedExerciseId
                  return (
                    <button
                      key={exercise.exerciseTemplateId}
                      type="button"
                      onClick={() => onSelect(exercise)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                        selected ? 'font-medium' : 'hover:bg-white/10',
                      )}
                      style={selected ? { background: 'var(--xn-clay-200)', color: 'var(--xn-clay-800)' } : undefined}
                    >
                      <span className="truncate">{exercise.exerciseName}</span>
                      {selected && <Check size={14} />}
                    </button>
                  )
                })
              ) : (
                <p className="px-3 py-3 text-sm text-muted">No exercises found.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="truncate font-medium text-text">{value}</p>
    </div>
  )
}
