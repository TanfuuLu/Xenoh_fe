import { useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent, ReactNode } from 'react'
import { useParams, Link, useLocation } from 'react-router'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronLeft, Plus, Trash2, CheckCircle2, Circle, Trophy, Dumbbell, Search, X, Copy, AlertTriangle, TriangleAlert, Activity, GripVertical } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { vi as viLocale, enUS } from 'date-fns/locale'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { slideUp, staggerContainer, scaleIn } from '@/shared/utils/motion'
import { cn } from '@/shared/utils/cn'
import { useT, useLangStore } from '@/shared/i18n'
import {
  useExercises,
  useCreateExercise,
  useDeleteExercise,
  useReorderExercises,
  useCompleteSet,
  useExerciseTemplates,
  useDailyWorkouts,
  useCopyDay,
} from '../index'
import type { ExerciseResponse, ExerciseSetResponse, ExerciseTemplateResponse } from '../types'

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DayWorkoutPage() {
  const { dailyWorkoutId = '' } = useParams()
  const { state } = useLocation()
  const locationState = state as { canEdit?: boolean; weeklyWorkoutId?: string } | null
  const canEdit = locationState?.canEdit ?? true
  const weeklyWorkoutId = locationState?.weeklyWorkoutId ?? ''
  const shouldReduce = useReducedMotion()
  const [showAdd, setShowAdd] = useState(false)
  const [showCopy, setShowCopy] = useState(false)
  const [copyTarget, setCopyTarget] = useState('')
  const [orderedExercises, setOrderedExercises] = useState<ExerciseResponse[]>([])
  const [draggedExerciseId, setDraggedExerciseId] = useState<string | null>(null)
  const autoScrollFrame = useRef<number | null>(null)
  const autoScrollSpeed = useRef(0)
  const t   = useT()
  const tw  = t.weekDetail
  const tdw = t.dayWorkout
  const tc  = t.common
  const lang = useLangStore((s) => s.lang)
  const dateLocale = lang === 'vi' ? viLocale : enUS

  const { data: exercises, isLoading } = useExercises(dailyWorkoutId)

  // ── Prefetch ALL templates on mount — no filter, data ready before modal opens
  const { data: templates = [], isLoading: templatesLoading } = useExerciseTemplates()

  const { mutate: createExercise, isPending: adding } = useCreateExercise(dailyWorkoutId)
  const { mutate: deleteExercise } = useDeleteExercise(dailyWorkoutId)
  const { mutate: completeSet } = useCompleteSet(dailyWorkoutId)
  const { mutate: reorderExercises } = useReorderExercises(dailyWorkoutId)

  const { data: siblingDays } = useDailyWorkouts(weeklyWorkoutId)
  const { mutate: copyDay, isPending: copying } = useCopyDay(weeklyWorkoutId)

  useEffect(() => {
    setOrderedExercises(exercises ?? [])
  }, [exercises])

  useEffect(() => () => stopDragAutoScroll(), [])

  const addSchema = z.object({
    exerciseTemplateId: z.string().min(1, tdw.selectExerciseError),
    plannedSets: z.coerce.number().int().min(1).max(100),
    plannedReps: z.coerce.number().int().min(1).max(1000),
    plannedWeight: z.coerce.number().min(0).max(10000).optional(),
    notes: z.string().optional(),
  })
  type AddForm = z.infer<typeof addSchema>

  const addForm = useForm<AddForm>({
    resolver: zodResolver(addSchema),
    defaultValues: { plannedSets: 3, plannedReps: 8 },
  })

  function onAdd(data: AddForm) {
    createExercise(
      { ...data, dailyWorkoutId },
      {
        onSuccess: () => {
          addForm.reset({ plannedSets: 3, plannedReps: 8 })
          setShowAdd(false)
        },
      },
    )
  }

  function handleCompleteSet(setId: string, actualReps: number, actualWeight: number, rpe?: number) {
    completeSet({ setId, data: { actualReps, actualWeight, rpe } })
  }

  function moveDraggedExercise(targetExerciseId: string) {
    if (!draggedExerciseId || draggedExerciseId === targetExerciseId) return

    setOrderedExercises((current) => {
      const fromIndex = current.findIndex((exercise) => exercise.id === draggedExerciseId)
      const toIndex = current.findIndex((exercise) => exercise.id === targetExerciseId)
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return current

      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  function stopDragAutoScroll() {
    autoScrollSpeed.current = 0
    if (autoScrollFrame.current != null) {
      window.cancelAnimationFrame(autoScrollFrame.current)
      autoScrollFrame.current = null
    }
  }

  function startDragAutoScroll(clientY: number) {
    const edgeSize = 110
    const maxSpeed = 18
    const bottomDistance = window.innerHeight - clientY
    const topDistance = clientY

    if (topDistance < edgeSize) {
      autoScrollSpeed.current = -Math.round(((edgeSize - topDistance) / edgeSize) * maxSpeed)
    } else if (bottomDistance < edgeSize) {
      autoScrollSpeed.current = Math.round(((edgeSize - bottomDistance) / edgeSize) * maxSpeed)
    } else {
      stopDragAutoScroll()
      return
    }

    if (autoScrollFrame.current != null) return

    const scrollStep = () => {
      if (autoScrollSpeed.current === 0) {
        autoScrollFrame.current = null
        return
      }

      window.scrollBy({ top: autoScrollSpeed.current, behavior: 'auto' })
      autoScrollFrame.current = window.requestAnimationFrame(scrollStep)
    }

    autoScrollFrame.current = window.requestAnimationFrame(scrollStep)
  }

  function saveExerciseOrder(nextExercises = orderedExercises) {
    if (!canEdit || nextExercises.length === 0) return
    reorderExercises({
      dailyWorkoutId,
      exerciseIds: nextExercises.map((exercise) => exercise.id),
    })
  }

  const currentDay = siblingDays?.find((d) => d.id === dailyWorkoutId)
  const copyTargetOptions =
    siblingDays
      ?.filter(
        (d) =>
          d.id !== dailyWorkoutId &&
          currentDay != null &&
          new Date(d.date) > new Date(currentDay.date),
      )
      .map((d) => ({
        value: d.id,
        label: `${d.dayOfWeek} · ${format(new Date(d.date), 'd MMM', { locale: dateLocale })}`,
      })) ?? []

  function handleCopyDay() {
    if (!copyTarget) return
    copyDay(
      { sourceDailyWorkoutId: dailyWorkoutId, data: { targetDailyWorkoutId: copyTarget } },
      {
        onSuccess: () => {
          setShowCopy(false)
          setCopyTarget('')
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const totalSets = exercises?.reduce((s, e) => s + e.sets.length, 0) ?? 0
  const doneSets  = exercises?.reduce((s, e) => s + e.completedSetsCount, 0) ?? 0
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0
  const completedExercises = exercises?.filter((e) => e.isCompleted).length ?? 0
  const isDayCompleted = (exercises?.length ?? 0) > 0 && completedExercises === exercises?.length
  const warningExercises = exercises?.filter(hasWarningExercise) ?? []
  const dayVolume = exercises?.reduce((sum, exercise) => sum + getExerciseVolume(exercise), 0) ?? 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to={-1 as unknown as string}>
            <Button variant="ghost" size="sm"><ChevronLeft size={16} /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text">{tdw.title}</h1>
            {totalSets > 0 && (
              <p className="text-xs text-muted">{doneSets}/{totalSets} sets · {pct}%</p>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {weeklyWorkoutId && (
              <Button variant="secondary" size="sm" onClick={() => { setShowCopy(true); setCopyTarget('') }}>
                <Copy size={15} /> {tw.copyDay}
              </Button>
            )}
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> {tdw.addExercise}
            </Button>
          </div>
        )}
      </div>

      {/* Overall progress bar */}
      {totalSets > 0 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--border-1)' }}>
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {isDayCompleted && (
        <DayResultCard
          exerciseCount={exercises?.length ?? 0}
          warningCount={warningExercises.length}
          volume={dayVolume}
        />
      )}

      {/* Exercise list */}
      <motion.div
        initial={shouldReduce ? false : 'hidden'}
        animate="visible"
        variants={staggerContainer}
        className="space-y-4"
      >
        <AnimatePresence>
          {orderedExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              canEdit={canEdit}
              animateLayout={!shouldReduce}
              isDragging={draggedExerciseId === exercise.id}
              onDragStart={() => setDraggedExerciseId(exercise.id)}
              onDragMove={startDragAutoScroll}
              onDragOver={(event) => {
                event.preventDefault()
                startDragAutoScroll(event.clientY)
                moveDraggedExercise(exercise.id)
              }}
              onDrop={() => {
                saveExerciseOrder()
                stopDragAutoScroll()
                setDraggedExerciseId(null)
              }}
              onDragEnd={() => {
                stopDragAutoScroll()
                setDraggedExerciseId(null)
              }}
              onCompleteSet={handleCompleteSet}
              onDelete={() => {
                if (confirm(tdw.deleteExerciseConfirm.replace('{name}', exercise.name))) {
                  deleteExercise(exercise.id)
                }
              }}
            />
          ))}
        </AnimatePresence>

        {orderedExercises.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface py-14 text-center">
            <Dumbbell size={36} className="text-muted/40" />
            <p className="text-muted">{tdw.empty}</p>
          </div>
        )}
      </motion.div>

      {/* Modal: Add exercise */}
      <Modal
        open={canEdit && showAdd}
        onClose={() => { setShowAdd(false); addForm.reset({ plannedSets: 3, plannedReps: 8 }) }}
        title={tdw.modalTitle}
        className="max-w-lg"
      >
        <form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-4">
          {/* Exercise picker — search + list */}
          <Controller
            name="exerciseTemplateId"
            control={addForm.control}
            render={({ field }) => (
              <ExercisePicker
                templates={templates}
                isLoading={templatesLoading}
                value={field.value ?? ''}
                onChange={field.onChange}
                error={addForm.formState.errors.exerciseTemplateId?.message}
              />
            )}
          />

          {/* Sets / Reps / Weight */}
          <div className="grid grid-cols-3 gap-3">
            <Input label="Sets"        type="number"             error={addForm.formState.errors.plannedSets?.message}  {...addForm.register('plannedSets')} />
            <Input label="Reps"        type="number"             error={addForm.formState.errors.plannedReps?.message}  {...addForm.register('plannedReps')} />
            <Input label="Weight (kg)" type="number" step="0.5"                                                         {...addForm.register('plannedWeight')} />
          </div>

          <Input label={tdw.notesLabel} placeholder="Focus on depth…" {...addForm.register('notes')} />

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => { setShowAdd(false); addForm.reset({ plannedSets: 3, plannedReps: 8 }) }}
            >
              {tc.cancel}
            </Button>
            <Button type="submit" loading={adding}>{tdw.addBtn}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Copy Day */}
      <AnimatePresence>
        {showCopy && (
          <Modal
            open={showCopy}
            onClose={() => { setShowCopy(false); setCopyTarget('') }}
            title={tw.copyDayTitle}
          >
            <motion.div initial="hidden" animate="visible" variants={scaleIn} className="space-y-4">
              <Select
                label={tw.copyDayTarget}
                options={copyTargetOptions}
                placeholder={tw.copyDayTargetPlaceholder}
                value={copyTarget}
                onChange={setCopyTarget}
              />

              {copyTarget && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
                  style={{
                    background: 'var(--xn-warning-bg, rgba(245,158,11,0.1))',
                    color: 'var(--xn-warning, #f59e0b)',
                  }}
                >
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{tw.copyDayWarning}</span>
                </motion.div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => { setShowCopy(false); setCopyTarget('') }}
                >
                  {tc.cancel}
                </Button>
                <Button
                  type="button"
                  disabled={!copyTarget}
                  loading={copying}
                  onClick={handleCopyDay}
                >
                  <Copy size={14} /> {tw.copyDayConfirm}
                </Button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Day Result ───────────────────────────────────────────────────────────────

interface DayResultCardProps {
  exerciseCount: number
  warningCount: number
  volume: number
}

function DayResultCard({ exerciseCount, warningCount, volume }: DayResultCardProps) {
  const status = warningCount > 0 ? 'Warning' : 'Good'
  const isWarning = warningCount > 0
  const formattedVolume = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: volume % 1 === 0 ? 0 : 1,
  }).format(volume)

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: isWarning ? 'rgba(245,158,11,0.12)' : 'var(--xn-sage-200)' }}
          >
            {isWarning ? (
              <TriangleAlert size={22} className="text-warning" />
            ) : (
              <CheckCircle2 size={22} className="text-success" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Daily Result</p>
            <h2 className="text-lg font-semibold text-text">Workout completed</h2>
          </div>
        </div>

        <Badge variant={isWarning ? 'warning' : 'success'}>{status}</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <ResultMetric label="Exercises" value={exerciseCount.toString()} />
        <ResultMetric
          label="Status"
          value={status}
          sub={isWarning ? `${warningCount} exercise${warningCount === 1 ? '' : 's'} warning` : 'No warning exercises'}
        />
        <ResultMetric
          label="Volume"
          value={`${formattedVolume} kg`}
          sub="sets x reps x weight"
          icon={<Activity size={16} />}
        />
      </div>
    </Card>
  )
}

interface ResultMetricProps {
  label: string
  value: string
  sub?: string
  icon?: ReactNode
}

function ResultMetric({ label, value, sub, icon }: ResultMetricProps) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
        {icon}
        {label}
      </div>
      <p className="text-xl font-bold text-text">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  )
}

function hasWarningExercise(exercise: ExerciseResponse) {
  return exercise.sets.some(
    (set) =>
      set.isCompleted &&
      ((set.actualReps != null && set.actualReps < set.plannedReps) ||
        (set.actualWeight != null && set.plannedWeight != null && set.actualWeight < set.plannedWeight)),
  )
}

function getExerciseVolume(exercise: ExerciseResponse) {
  return exercise.sets.reduce((total, set) => {
    if (!set.isCompleted) return total
    const reps = set.actualReps ?? set.plannedReps
    const weight = set.actualWeight ?? set.plannedWeight ?? 0
    return total + reps * weight
  }, 0)
}

// ─── ExercisePicker ───────────────────────────────────────────────────────────

interface ExercisePickerProps {
  templates: ExerciseTemplateResponse[]
  isLoading: boolean
  value: string
  onChange: (id: string) => void
  error?: string
}

function ExercisePicker({ templates, isLoading, value, onChange, error }: ExercisePickerProps) {
  const [search, setSearch] = useState('')
  const t = useT()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return templates
    return templates.filter(
      (tmpl) =>
        tmpl.name.toLowerCase().includes(q) ||
        tmpl.primaryMuscleGroup.toLowerCase().includes(q),
    )
  }, [templates, search])

  const selected = templates.find((t) => t.id === value)

  return (
    <div className="space-y-2">
      {/* Selected exercise preview */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm"
            style={{ background: 'var(--xn-clay-200)', border: '1px solid var(--xn-clay-400)' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 size={14} style={{ color: 'var(--xn-clay-700)', flexShrink: 0 }} />
              <span className="font-medium truncate" style={{ color: 'var(--xn-clay-800)' }}>{selected.name}</span>
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search input */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--fg-3)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.dayWorkout.searchExercise}
          className="xn-input w-full pl-9 pr-4 text-sm"
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
        className="max-h-52 overflow-y-auto rounded-xl border p-1.5 space-y-0.5"
        style={{ borderColor: 'var(--border-1)', background: 'var(--bg-1)' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Spinner size="sm" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-5 text-center text-sm text-muted">{t.dayWorkout.noExerciseFound}</p>
        ) : (
          filtered.map((tmpl) => {
            const isSelected = tmpl.id === value
            return (
              <div
                key={tmpl.id}
                onClick={() => onChange(tmpl.id)}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors select-none',
                  isSelected ? 'font-medium' : 'hover:bg-white/6',
                )}
                style={isSelected ? { background: 'var(--xn-clay-200)', color: 'var(--xn-clay-800)' } : undefined}
              >
                <span className="truncate">{tmpl.name}</span>
                <span
                  className="ml-3 flex-shrink-0 rounded-md px-1.5 py-0.5 text-xs"
                  style={{
                    background: isSelected ? 'rgba(139,100,60,0.15)' : 'var(--bg-3)',
                    color: isSelected ? 'var(--xn-clay-700)' : 'var(--fg-3)',
                  }}
                >
                  {tmpl.primaryMuscleGroup}
                </span>
              </div>
            )
          })
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

// ─── ExerciseCard ─────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: ExerciseResponse
  canEdit: boolean
  animateLayout: boolean
  isDragging: boolean
  onDragStart: () => void
  onDragMove: (clientY: number) => void
  onDragOver: (event: DragEvent<HTMLDivElement>) => void
  onDrop: () => void
  onDragEnd: () => void
  onCompleteSet: (setId: string, actualReps: number, actualWeight: number, rpe?: number) => void
  onDelete: () => void
}

function ExerciseCard({
  exercise,
  canEdit,
  animateLayout,
  isDragging,
  onDragStart,
  onDragMove,
  onDragOver,
  onDrop,
  onDragEnd,
  onCompleteSet,
  onDelete,
}: ExerciseCardProps) {
  const pct = exercise.sets.length > 0
    ? Math.round((exercise.completedSetsCount / exercise.sets.length) * 100)
    : 0

  const hasUnderperformed = hasWarningExercise(exercise)

  return (
    <motion.div
      layout={animateLayout ? 'position' : false}
      variants={slideUp}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{
        layout: { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 },
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        'rounded-xl border border-border p-4 space-y-3 transition-[box-shadow,border-color,background-color,opacity,scale] duration-200',
        isDragging && 'scale-[1.01] opacity-70 shadow-lg ring-2 ring-primary/25',
      )}
      style={
        hasUnderperformed
          ? { borderColor: 'var(--color-warning)', background: 'rgba(245,158,11,0.07)' }
          : exercise.isCompleted
          ? { borderColor: 'var(--xn-sage-400)', background: 'var(--xn-sage-200)' }
          : undefined
      }
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <button
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move'
                  onDragStart()
                }}
                onDrag={(event) => {
                  if (event.clientY > 0) onDragMove(event.clientY)
                }}
                onDragEnd={onDragEnd}
                className="cursor-grab rounded-md p-1 text-muted active:cursor-grabbing"
                title="Drag to reorder"
              >
                <GripVertical size={15} />
              </button>
            )}
            <h3 className="font-semibold text-text">{exercise.name}</h3>
            {exercise.isCompleted && !hasUnderperformed && <Badge variant="success">Done ✓</Badge>}
            {hasUnderperformed && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                <TriangleAlert size={12} /> Below target
              </span>
            )}
            {exercise.personalRecordWeight != null && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                <Trophy size={11} /> PR {exercise.personalRecordWeight} kg
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {exercise.plannedSets}×{exercise.plannedReps}
            {exercise.plannedWeight ? ` @ ${exercise.plannedWeight} kg` : ''} · {exercise.primaryMuscleGroup}
          </p>
          {exercise.notes && <p className="mt-1 text-xs italic text-muted">{exercise.notes}</p>}
        </div>
        {canEdit && (
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 text-muted transition-colors hover:text-danger"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--xn-danger-bg)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Per-exercise progress bar */}
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--border-1)' }}>
          <div
            className="h-full rounded-full bg-success transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-10 text-right text-xs tabular-nums text-muted">
          {exercise.completedSetsCount}/{exercise.sets.length}
        </span>
      </div>

      {/* Sets */}
      <div className="space-y-1.5">
        {exercise.sets.map((set) => (
          <SetRow key={set.id} set={set} onComplete={onCompleteSet} />
        ))}
      </div>
    </motion.div>
  )
}

// ─── SetRow ───────────────────────────────────────────────────────────────────

interface SetRowProps {
  set: ExerciseSetResponse
  onComplete: (setId: string, actualReps: number, actualWeight: number, rpe?: number) => void
}

function SetRow({ set, onComplete }: SetRowProps) {
  const [reps, setReps]     = useState(set.plannedReps)
  const [weight, setWeight] = useState(set.plannedWeight ?? 0)
  const [rpe, setRpe]       = useState('')
  const t = useT()

  function handleComplete() {
    const actualReps = Number.isFinite(reps) && reps >= 1 ? reps : set.plannedReps
    const actualWeight = Number.isFinite(weight) && weight >= 0 ? weight : set.plannedWeight ?? 0
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
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-success"
        style={{ background: 'var(--xn-sage-200)' }}
      >
        <CheckCircle2 size={17} className="flex-shrink-0" />
        <span className="w-12 font-medium">Set {set.setNumber}</span>
        <span className="flex-1">
          {set.actualReps ?? set.plannedReps} reps @ {set.actualWeight ?? set.plannedWeight ?? 0} kg
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
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
      <span className="w-12 flex-shrink-0 text-sm font-medium text-muted">Set {set.setNumber}</span>

      {/* Reps */}
      <div className="flex items-center gap-1">
        <input
          type="number" min={1} max={1000}
          value={reps}
          onChange={(e) => setReps(Number(e.target.value))}
          className="w-14 rounded-md border border-border bg-background px-2 py-1 text-center text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <span className="text-xs text-muted">reps</span>
      </div>

      <span className="text-muted/40">@</span>

      {/* Weight */}
      <div className="flex items-center gap-1">
        <input
          type="number" min={0} max={10000} step={0.5}
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
          className="w-16 rounded-md border border-border bg-background px-2 py-1 text-center text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <span className="text-xs text-muted">kg</span>
      </div>

      {/* RPE — optional */}
      <div className="flex items-center gap-1">
        <input
          type="number" min={1} max={10} step={0.5}
          value={rpe}
          placeholder="—"
          onChange={(e) => setRpe(e.target.value)}
          className="w-12 rounded-md border border-border bg-background px-2 py-1 text-center text-sm text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <span className="text-xs text-muted">{t.dayWorkout.rpeLabel}</span>
      </div>

      {/* Complete button */}
      <button
        onClick={handleComplete}
        className="ml-auto flex-shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:text-success active:scale-95"
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--xn-sage-200)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
        title="Mark done"
      >
        <Circle size={20} />
      </button>
    </div>
  )
}
