import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent, ReactNode } from 'react'
import { useParams, Link, useLocation } from 'react-router'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronLeft, Plus, Trash2, CheckCircle2, Circle, Trophy, Dumbbell, Search, X, Copy, AlertTriangle, TriangleAlert, Activity, GripVertical, BedDouble, XCircle, Play, Square, Timer, Flame, Check, Sparkles, RefreshCw, MessageSquareText } from 'lucide-react'
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
import { MuscleGroup, type DayStatus, type MuscleGroup as MuscleGroupValue } from '@/shared/types/api'
import { NotFoundPage } from '@/shared/components/NotFoundPage'
import { useConfirm } from '@/shared/components/ConfirmModal'
import {
  useExercises,
  useCreateExercise,
  useDeleteExercise,
  useReorderExercises,
  useCompleteSet,
  useStartExerciseTimer,
  useFinishExerciseTimer,
  useSetExerciseDuration,
  useExerciseTemplates,
  useLastExercisePerformance,
  useDailyWorkouts,
  useCopyDay,
  useMarkDayStatus,
} from '../index'
import type { ExerciseResponse, ExerciseSetResponse, ExerciseTemplateResponse, WorkoutGuidanceResponse } from '../types'
import { useMyProfile } from '@/features/profile'
import { useLocalizedExerciseName } from '../exerciseNames'
import { InlineTip } from '@/features/tips'

// ─── Page ─────────────────────────────────────────────────────────────────────

const VALID_EXERCISE_DURATION_SECONDS = 60

export function DayWorkoutPage() {
  const { dailyWorkoutId = '' } = useParams()
  const { state } = useLocation()
  const locationState = state as { canEdit?: boolean; canComplete?: boolean; weeklyWorkoutId?: string; planId?: string } | null
  const canEdit = locationState?.canEdit ?? false
  const canComplete = locationState?.canComplete ?? false
  const weeklyWorkoutId = locationState?.weeklyWorkoutId ?? ''
  const planId = locationState?.planId
  const shouldReduce = useReducedMotion()
  const [showAdd, setShowAdd] = useState(false)
  const [showCopy, setShowCopy] = useState(false)
  const [showMarkDay, setShowMarkDay] = useState(false)
  const [copyTarget, setCopyTarget] = useState('')
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroupValue | ''>('')
  const [orderedExercises, setOrderedExercises] = useState<ExerciseResponse[]>([])
  const [draggedExerciseId, setDraggedExerciseId] = useState<string | null>(null)
  const [plannedWeightEdited, setPlannedWeightEdited] = useState(false)

  const [showDayResult, setShowDayResult] = useState(false)
  const [listHeight, setListHeight] = useState(400)
  const autoScrollFrame = useRef<number | null>(null)
  const autoScrollSpeed = useRef(0)
  const lastDragOverId = useRef<string | null>(null)
  const exerciseListRef = useRef<HTMLDivElement>(null)
  const t   = useT()
  const tw  = t.weekDetail
  const tdw = t.dayWorkout
  const tc  = t.common
  const lang = useLangStore((s) => s.lang)
  const dateLocale = lang === 'vi' ? viLocale : enUS

  const { data: exercises, isLoading, isError: exercisesError } = useExercises(dailyWorkoutId)

  // ── Prefetch ALL templates on mount — no filter, data ready before modal opens
  const { data: templates = [], isLoading: templatesLoading } = useExerciseTemplates({
    muscleGroup: selectedMuscleGroup || undefined,
  })

  const { mutate: createExercise, isPending: adding } = useCreateExercise(dailyWorkoutId, weeklyWorkoutId, planId)
  const { mutate: deleteExercise } = useDeleteExercise(dailyWorkoutId, weeklyWorkoutId, planId)
  const { mutate: completeSet } = useCompleteSet(dailyWorkoutId, weeklyWorkoutId, planId)
  const { mutate: startTimer, isPending: startingTimer } = useStartExerciseTimer(dailyWorkoutId)
  const { mutate: finishTimer, isPending: finishingTimer } = useFinishExerciseTimer(dailyWorkoutId, weeklyWorkoutId, planId)
  const { mutate: setDuration } = useSetExerciseDuration(dailyWorkoutId, weeklyWorkoutId, planId)
  const { mutate: reorderExercises } = useReorderExercises(dailyWorkoutId, weeklyWorkoutId, planId)

  const { data: siblingDays } = useDailyWorkouts(weeklyWorkoutId)
  const { mutate: copyDay, isPending: copying } = useCopyDay(weeklyWorkoutId, planId)
  const { mutate: markDayStatus, isPending: markingStatus } = useMarkDayStatus(weeklyWorkoutId, planId)

  const { confirm, ConfirmDialog } = useConfirm()

  const currentDay = siblingDays?.find((d) => d.id === dailyWorkoutId)
  const dayStatus: DayStatus = currentDay?.status ?? 'Normal'

  useEffect(() => {
    setOrderedExercises(exercises ?? [])
  }, [exercises])

  useEffect(() => () => stopDragAutoScroll(), [])

  useEffect(() => {
    const update = () => {
      if (!exerciseListRef.current) return
      const top = exerciseListRef.current.getBoundingClientRect().top
      setListHeight(window.innerHeight - top - 20)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  })

  const addSchema = z.object({
    exerciseTemplateId: z.string().min(1, tdw.selectExerciseError),
    plannedSets: z.coerce.number().int().min(1).max(100).optional(),
    plannedReps: z.coerce.number().int().min(1).max(1000).optional(),
    plannedWeight: z.coerce.number().min(0).max(10000).optional(),
    plannedDuration: z.coerce.number().int().min(1).max(600).optional(),
    notes: z.string().optional(),
  })
  type AddForm = z.output<typeof addSchema>

  const addForm = useForm<z.input<typeof addSchema>, unknown, AddForm>({
    resolver: zodResolver(addSchema),
    defaultValues: { plannedSets: 3, plannedReps: 8 },
  })

  const selectedTemplateId = addForm.watch('exerciseTemplateId')
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)
  const isCardio = selectedTemplate?.exerciseKind === 'Cardio'
  const { data: lastPerformance } = useLastExercisePerformance(
    dailyWorkoutId,
    selectedTemplateId ?? '',
    showAdd && !!selectedTemplateId && !isCardio,
  )

  useEffect(() => {
    setPlannedWeightEdited(false)
  }, [selectedTemplateId])

  useEffect(() => {
    if (!showAdd || isCardio || !lastPerformance?.lastActualWeight) return
    if (plannedWeightEdited) return

    addForm.setValue('plannedWeight', lastPerformance.lastActualWeight, {
      shouldDirty: false,
      shouldValidate: true,
    })
  }, [addForm, isCardio, lastPerformance?.lastActualWeight, plannedWeightEdited, showAdd])

  function onAdd(data: AddForm) {
    const payload = isCardio
      ? {
          dailyWorkoutId,
          exerciseTemplateId: data.exerciseTemplateId,
          plannedSets: 1,
          plannedReps: data.plannedDuration ?? 30,
          notes: data.notes,
        }
      : {
          dailyWorkoutId,
          exerciseTemplateId: data.exerciseTemplateId,
          plannedSets: data.plannedSets ?? 3,
          plannedReps: data.plannedReps ?? 8,
          plannedWeight: data.plannedWeight,
          notes: data.notes,
        }
    createExercise(payload, {
      onSuccess: () => {
        addForm.reset({ plannedSets: 3, plannedReps: 8, plannedDuration: undefined })
        setPlannedWeightEdited(false)
        setSelectedMuscleGroup('')
        setShowAdd(false)
      },
    })
  }

  function handleCompleteSet(setId: string, actualReps: number, actualWeight: number, rpe?: number) {
    completeSet({ setId, data: { actualReps, actualWeight, rpe } })
  }

  function moveDraggedExercise(targetExerciseId: string) {
    if (!draggedExerciseId || draggedExerciseId === targetExerciseId) return
    if (lastDragOverId.current === targetExerciseId) return
    lastDragOverId.current = targetExerciseId

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

  function moveDraggedToEnd() {
    if (!draggedExerciseId) return
    setOrderedExercises((current) => {
      const fromIndex = current.findIndex((exercise) => exercise.id === draggedExerciseId)
      if (fromIndex < 0 || fromIndex === current.length - 1) return current
      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      next.push(moved)
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
    const container = exerciseListRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const edgeSize = 80
    const maxSpeed = 14
    const topDistance = clientY - rect.top
    const bottomDistance = rect.bottom - clientY

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
      container.scrollBy({ top: autoScrollSpeed.current, behavior: 'instant' as ScrollBehavior })
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

  if (exercisesError) return <NotFoundPage />

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
  const estimatedCalories = exercises?.reduce((sum, exercise) => sum + (exercise.estimatedCalories ?? 0), 0) ?? 0
  const totalDurationSeconds = exercises?.reduce((sum, e) => sum + (e.durationSeconds ?? 0), 0) ?? 0
  const rpeValues = exercises?.flatMap((e) => e.sets).filter((s) => s.isCompleted && s.rpe != null).map((s) => s.rpe as number) ?? []
  const averageRpe = rpeValues.length > 0 ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length : null
  const lastPerformanceText = lastPerformance?.lastActualWeight != null
    ? [
        `${tdw.lastTime}: ${lastPerformance.lastActualWeight} kg`,
        lastPerformance.lastActualReps != null ? `× ${lastPerformance.lastActualReps}` : null,
        lastPerformance.lastRpe != null ? `RPE ${lastPerformance.lastRpe}` : null,
        lastPerformance.workoutDate
          ? format(new Date(lastPerformance.workoutDate), 'd MMM yyyy', { locale: dateLocale })
          : null,
      ].filter(Boolean).join(' · ')
    : null

  return (
    <>
    {ConfirmDialog}
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Link to={-1 as unknown as string}>
            <Button variant="ghost" size="sm"><ChevronLeft size={16} /></Button>
          </Link>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="break-words text-2xl font-bold text-text">{tdw.title}</h1>
              <InlineTip placement="day-workout" />
            </div>
            {totalSets > 0 && (
              <p className="text-xs text-muted">{doneSets}/{totalSets} {tdw.setsUnit} · {pct}%</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">

          {canComplete && !isDayCompleted && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 min-[390px]:flex-none"
              onClick={() => setShowMarkDay(true)}
              style={
                dayStatus === 'Rest'
                  ? { borderColor: 'var(--xn-clay-500)', color: 'var(--xn-clay-700)' }
                  : dayStatus === 'Missed'
                  ? { borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }
                  : undefined
              }
            >
              {dayStatus === 'Rest' ? <BedDouble size={15} /> : dayStatus === 'Missed' ? <XCircle size={15} /> : <XCircle size={15} />}
              {dayStatus === 'Normal' ? tdw.markDay : dayStatus === 'Rest' ? tdw.restDayBtn : tdw.missedBtn}
            </Button>
          )}
          {canEdit && (
            <>
              {weeklyWorkoutId && (
                <Button variant="secondary" size="sm" className="flex-1 min-[390px]:flex-none" onClick={() => { setShowCopy(true); setCopyTarget('') }}>
                  <Copy size={15} /> {tw.copyDay}
                </Button>
              )}
              <Button size="sm" className="flex-1 min-[390px]:flex-none" onClick={() => setShowAdd(true)}>
                <Plus size={16} /> {tdw.addExercise}
              </Button>
            </>
          )}
        </div>
      </div>

      <SessionSummaryBar
        exerciseCount={exercises?.length ?? 0}
        completedExercises={completedExercises}
        doneSets={doneSets}
        totalSets={totalSets}
        pct={pct}
        isDayCompleted={isDayCompleted}
        dayStatus={dayStatus}
        warningCount={warningExercises.length}
        volume={dayVolume}
        totalDurationSeconds={totalDurationSeconds}
        averageRpe={averageRpe}
        onOpenResult={isDayCompleted ? () => setShowDayResult(true) : undefined}
      />

      {/* Exercise list */}
      <div
        ref={exerciseListRef}
        className="overflow-y-auto rounded-xl pr-1"
        style={{ height: listHeight }}
      >
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
              canComplete={canComplete}
              animateLayout={!shouldReduce && draggedExerciseId === null}
              isDragging={draggedExerciseId === exercise.id}
              onDragStart={() => {
                setDraggedExerciseId(exercise.id)
                lastDragOverId.current = null
              }}
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
                saveExerciseOrder()
                stopDragAutoScroll()
                setDraggedExerciseId(null)
              }}
              onCompleteSet={handleCompleteSet}
              onStartTimer={() => startTimer(exercise.id)}
              onFinishTimer={() => finishTimer(exercise.id)}
              onSetDuration={(durationSeconds) => setDuration({ exerciseId: exercise.id, durationSeconds })}
              timerPending={startingTimer || finishingTimer}
              onDelete={async () => {
                if (await confirm(tdw.deleteExerciseConfirm.replace('{name}', exercise.name), { confirmLabel: tc.delete, danger: true })) {
                  deleteExercise(exercise.id)
                }
              }}
            />
          ))}
        </AnimatePresence>

        {draggedExerciseId !== null && (
          <div
            className="h-16"
            onDragOver={(e) => {
              e.preventDefault()
              moveDraggedToEnd()
            }}
            onDrop={() => {
              saveExerciseOrder()
              stopDragAutoScroll()
              setDraggedExerciseId(null)
            }}
          />
        )}

        {orderedExercises.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface py-14 text-center">
            <Dumbbell size={36} className="text-muted/40" />
            <p className="text-muted">{tdw.empty}</p>
          </div>
        )}
      </motion.div>
      </div>

      {/* Modal: Add exercise */}
      <Modal
        open={canEdit && showAdd}
        onClose={() => { setShowAdd(false); setSelectedMuscleGroup(''); setPlannedWeightEdited(false); addForm.reset({ plannedSets: 3, plannedReps: 8, plannedDuration: undefined }) }}
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
                muscleGroup={selectedMuscleGroup}
                onMuscleGroupChange={setSelectedMuscleGroup}
                onChange={field.onChange}
                error={addForm.formState.errors.exerciseTemplateId?.message}
              />
            )}
          />

          {/* Sets / Reps / Weight — or Duration for cardio */}
          {isCardio ? (
            <Input
              label={tdw.howLong}
              type="number"
              min={1}
              error={addForm.formState.errors.plannedDuration?.message}
              {...addForm.register('plannedDuration')}
            />
          ) : (
            <div className="space-y-2">
              <div className="grid gap-3 sm:grid-cols-3">
                <Input label={tdw.setsLabel}   type="number"             error={addForm.formState.errors.plannedSets?.message}  {...addForm.register('plannedSets')} />
                <Input label={tdw.repsLabel}   type="number"             error={addForm.formState.errors.plannedReps?.message}  {...addForm.register('plannedReps')} />
                <Input
                  label={tdw.weightKg}
                  type="number"
                  step="0.5"
                  {...addForm.register('plannedWeight', { onChange: () => setPlannedWeightEdited(true) })}
                />
              </div>
              {lastPerformanceText && (
                <p className="text-xs font-medium" style={{ color: 'var(--fg-3)' }}>
                  {lastPerformanceText}
                </p>
              )}
            </div>
          )}

          <Input label={tdw.notesLabel} placeholder="Focus on depth…" {...addForm.register('notes')} />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              type="button"
              className="w-full sm:w-auto"
              onClick={() => { setShowAdd(false); setSelectedMuscleGroup(''); setPlannedWeightEdited(false); addForm.reset({ plannedSets: 3, plannedReps: 8, plannedDuration: undefined }) }}
            >
              {tc.cancel}
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={adding}>{tdw.addBtn}</Button>
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

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <Button
                  variant="secondary"
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => { setShowCopy(false); setCopyTarget('') }}
                >
                  {tc.cancel}
                </Button>
                <Button
                  type="button"
                  className="w-full sm:w-auto"
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

      {/* Modal: Mark Day as Rest / Missed */}
      <AnimatePresence>
        {showMarkDay && (
          <Modal
            open={showMarkDay}
            onClose={() => setShowMarkDay(false)}
            title={tdw.markDayTitle}
          >
            <motion.div initial="hidden" animate="visible" variants={scaleIn} className="space-y-3">
              <p className="text-sm text-muted">
                {dayStatus === 'Normal' ? tdw.markDayChoose : tdw.markDayAlready}
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    markDayStatus({ dailyWorkoutId, status: 'Rest' })
                    setShowMarkDay(false)
                  }}
                  disabled={markingStatus}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors',
                    dayStatus === 'Rest'
                      ? 'border-xn-clay-500 bg-xn-clay-100'
                      : 'border-border hover:border-xn-clay-400 hover:bg-xn-clay-100/50',
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--xn-clay-200)' }}>
                    <BedDouble size={18} style={{ color: 'var(--xn-clay-700)' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-text">{tdw.restDayBtn}</p>
                    <p className="text-xs text-muted">{tdw.restDayDesc}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    markDayStatus({ dailyWorkoutId, status: 'Missed' })
                    setShowMarkDay(false)
                  }}
                  disabled={markingStatus}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors',
                    dayStatus === 'Missed'
                      ? 'border-red-400 bg-red-50'
                      : 'border-border hover:border-red-300 hover:bg-red-50/50',
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <XCircle size={18} style={{ color: 'var(--color-danger)' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-text">{tdw.missedBtn}</p>
                    <p className="text-xs text-muted">{tdw.missedDesc}</p>
                  </div>
                </button>
              </div>

              {dayStatus !== 'Normal' && (
                <div className="flex justify-end pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={markingStatus}
                    onClick={() => {
                      markDayStatus({ dailyWorkoutId, status: 'Normal' })
                      setShowMarkDay(false)
                    }}
                  >
                    {tdw.removeMark}
                  </Button>
                </div>
              )}
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>


      <Modal
        open={showDayResult}
        onClose={() => setShowDayResult(false)}
        title={tdw.dailyResult}
        className="max-w-4xl"
      >
        <DayResultCard
          exerciseCount={exercises?.length ?? 0}
          warningCount={warningExercises.length}
          volume={dayVolume}
          estimatedCalories={estimatedCalories}
          totalDurationSeconds={totalDurationSeconds}
          averageRpe={averageRpe}
          embedded
        />
      </Modal>
    </div>
    </>
  )
}

// ─── Day Result ───────────────────────────────────────────────────────────────

interface DayResultCardProps {
  exerciseCount: number
  warningCount: number
  volume: number
  estimatedCalories: number
  totalDurationSeconds: number
  averageRpe: number | null
  embedded?: boolean
}

interface SessionSummaryBarProps {
  exerciseCount: number
  completedExercises: number
  doneSets: number
  totalSets: number
  pct: number
  isDayCompleted: boolean
  dayStatus: DayStatus
  warningCount: number
  volume: number
  totalDurationSeconds: number
  averageRpe: number | null
  onOpenResult?: () => void
}

function SessionSummaryBar({
  exerciseCount,
  completedExercises,
  doneSets,
  totalSets,
  pct,
  isDayCompleted,
  dayStatus,
  warningCount,
  volume,
  totalDurationSeconds,
  averageRpe,
  onOpenResult,
}: SessionSummaryBarProps) {
  const { dayWorkout: td } = useT()
  const formattedVolume = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: volume % 1 === 0 ? 0 : 1,
  }).format(volume)
  const statusLabel =
    isDayCompleted
      ? warningCount > 0
        ? td.statusWarning
        : td.statusGood
      : dayStatus === 'Rest'
      ? td.restDayBtn
      : dayStatus === 'Missed'
      ? td.missedBtn
      : `${pct}%`

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isDayCompleted ? (warningCount > 0 ? 'warning' : 'success') : 'default'}>
              {statusLabel}
            </Badge>
            <span className="text-sm font-semibold text-text">
              {doneSets}/{totalSets || 0} {td.setsUnit}
            </span>
            <span className="text-sm text-muted">
              {completedExercises}/{exerciseCount || 0} {td.exercisesUnit}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--border-1)' }}>
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm sm:flex sm:items-center sm:gap-4">
          <MiniStat icon={<Activity size={14} />} value={`${formattedVolume} kg`} label={td.volumeLabel} />
          <MiniStat icon={<Timer size={14} />} value={totalDurationSeconds > 0 ? formatDuration(totalDurationSeconds) : '—'} label={td.totalTimeLabel} />
          <MiniStat value={averageRpe != null ? averageRpe.toFixed(1) : '—'} label={td.avgRpeLabel} />
        </div>

        {onOpenResult && (
          <Button size="sm" variant="secondary" className="w-full lg:w-auto" onClick={onOpenResult}>
            <CheckCircle2 size={15} />
            {td.dailyResult}
          </Button>
        )}
      </div>
    </div>
  )
}

interface MiniStatProps {
  value: string
  label: string
  icon?: ReactNode
}

function MiniStat({ value, label, icon }: MiniStatProps) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 font-semibold text-text">
        {icon}
        <span className="truncate">{value}</span>
      </div>
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted">{label}</p>
    </div>
  )
}

function DayResultCard({ exerciseCount, warningCount, volume, estimatedCalories, totalDurationSeconds, averageRpe, embedded = false }: DayResultCardProps) {
  const { dayWorkout: td, weekAnalyze: ta } = useT()
  const isWarning = warningCount > 0
  const status = isWarning ? td.statusWarning : td.statusGood
  const formattedVolume = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: volume % 1 === 0 ? 0 : 1,
  }).format(volume)

  const content = (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: isWarning ? 'rgba(245,158,11,0.12)' : 'var(--xn-sage-200)' }}
          >
            {isWarning ? (
              <TriangleAlert size={17} className="text-warning" />
            ) : (
              <CheckCircle2 size={17} className="text-success" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{td.dailyResult}</p>
            <h2 className="text-base font-semibold text-text">{td.workoutCompleted}</h2>
          </div>
        </div>

        <Badge variant={isWarning ? 'warning' : 'success'}>{status}</Badge>
      </div>

      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <ResultMetric label={td.exercisesLabel} value={exerciseCount.toString()} />
        <ResultMetric
          label={td.statusLabel}
          value={status}
          sub={isWarning
            ? (warningCount === 1 ? td.exerciseWarning : td.exercisesWarning).replace('{n}', String(warningCount))
            : td.noWarning}
        />
        <ResultMetric
          label={td.volumeLabel}
          value={`${formattedVolume} kg`}
          sub={td.setsRepsWeight}
          icon={<Activity size={16} />}
        />
        <ResultMetric
          label={td.estimatedCalLabel}
          value={estimatedCalories > 0 ? `${Math.round(estimatedCalories)} kcal` : '—'}
          sub={estimatedCalories > 0 ? td.metCalc : ta.noTimedExercises}
          icon={<Flame size={16} />}
        />
        <ResultMetric
          label={td.totalTimeLabel}
          value={totalDurationSeconds > 0 ? formatDuration(totalDurationSeconds) : '—'}
          sub={totalDurationSeconds > 0 ? td.sumTimedExercises : ta.noTimedExercises}
          icon={<Timer size={16} />}
        />
        <ResultMetric
          label={td.avgRpeLabel}
          value={averageRpe != null ? averageRpe.toFixed(1) : '—'}
          sub={averageRpe != null ? ta.rpeDesc : ta.noRpeLogged}
        />
      </div>
    </>
  )

  if (embedded) {
    return <div className="space-y-3">{content}</div>
  }

  return (
    <Card className="space-y-3" style={{ padding: '12px 14px' }}>
      {content}
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
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">
        {icon}
        {label}
      </div>
      <p className="text-lg font-bold leading-tight text-text">{value}</p>
      {sub && <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted">{sub}</p>}
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
  muscleGroup: MuscleGroupValue | ''
  onMuscleGroupChange: (muscleGroup: MuscleGroupValue | '') => void
  onChange: (id: string) => void
  error?: string
}

function ExercisePicker({
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
            src={`${import.meta.env.VITE_API_URL}${template.imageUrl}`}
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

// ─── ExerciseCard ─────────────────────────────────────────────────────────────

function formatMuscleGroup(group: MuscleGroupValue) {
  return group.replace(/([a-z])([A-Z])/g, '$1 $2')
}

function WorkoutGuidancePanel({
  guidance,
  loading,
  fetching,
  error,
  requested,
  onRequest,
  onRefresh,
}: {
  guidance: WorkoutGuidanceResponse | undefined
  loading: boolean
  fetching: boolean
  error: boolean
  requested: boolean
  onRequest: () => void
  onRefresh: () => void
}) {
  const lang = useLangStore((s) => s.lang)
  const tdw = useT().dayWorkout
  const labels = lang === 'vi'
    ? {
        title: 'Gợi ý AI cho buổi tập',
        loading: 'Đang phân tích buổi tập...',
        error: 'Chưa thể tạo gợi ý AI.',
        refresh: 'Làm mới',
        adjustments: 'Điều chỉnh nên cân nhắc',
        cautions: 'Điểm cần chú ý',
        actions: 'Bước tiếp theo',
        cached: 'Đã lưu',
      }
    : {
        title: tdw.aiWorkoutGuidance,
        loading: 'Analyzing this workout...',
        error: tdw.aiGuidanceUnavailable,
        refresh: tdw.refresh,
        adjustments: 'Recommended adjustments',
        cautions: 'Caution flags',
        actions: 'Next best actions',
        cached: tdw.cached,
      }

  const showLabel = tdw.showAiGuidance
  const idleLabel = tdw.aiGuidanceIdle

  const readinessVariant =
    guidance?.readiness === 'High' ? 'success' :
    guidance?.readiness === 'Low' ? 'warning' :
    'primary'

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'var(--xn-clay-100)', color: 'var(--xn-clay-700)' }}
          >
            <Sparkles size={17} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-text">{labels.title}</p>
              {guidance && <Badge variant={readinessVariant}>{guidance.readiness}</Badge>}
              {guidance?.cached && <Badge>{labels.cached}</Badge>}
            </div>
            {loading ? (
              <p className="mt-1 text-sm text-muted">{labels.loading}</p>
            ) : error ? (
              <p className="mt-1 text-sm text-warning">{labels.error}</p>
            ) : guidance ? (
              <p className="mt-1 text-sm text-muted">{guidance.headline}</p>
            ) : (
              <p className="mt-1 text-sm text-muted">{idleLabel}</p>
            )}
          </div>
        </div>
        {requested ? (
          <Button size="sm" variant="secondary" onClick={onRefresh} disabled={fetching} className="self-start">
            <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
            {labels.refresh}
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={onRequest} className="self-start">
            <Sparkles size={14} />
            {showLabel}
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Spinner size="sm" /> {labels.loading}
        </div>
      )}

      {guidance && !loading && (
        <div className="grid gap-3 md:grid-cols-3">
          <GuidanceList title={labels.adjustments} items={guidance.recommendedAdjustments} />
          <GuidanceList title={labels.cautions} items={guidance.cautionFlags} />
          <GuidanceList title={labels.actions} items={guidance.nextBestActions} />
        </div>
      )}
    </div>
  )
}

function GuidanceList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      {items.length > 0 ? (
        <ul className="space-y-1.5 text-sm text-text">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="leading-relaxed">{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">-</p>
      )}
    </div>
  )
}

interface ExerciseCardProps {
  exercise: ExerciseResponse
  canEdit: boolean
  canComplete: boolean
  animateLayout: boolean
  isDragging: boolean
  onDragStart: () => void
  onDragMove: (clientY: number) => void
  onDragOver: (event: DragEvent<HTMLDivElement>) => void
  onDrop: () => void
  onDragEnd: () => void
  onCompleteSet: (setId: string, actualReps: number, actualWeight: number, rpe?: number) => void
  onStartTimer: () => void
  onFinishTimer: () => void
  onSetDuration: (durationSeconds: number) => void
  timerPending: boolean
  onDelete: () => void
}

function ExerciseCard({
  exercise,
  canEdit,
  canComplete,
  animateLayout,
  isDragging,
  onDragStart,
  onDragMove,
  onDragOver,
  onDrop,
  onDragEnd,
  onCompleteSet,
  onStartTimer,
  onFinishTimer,
  onSetDuration,
  timerPending,
  onDelete,
}: ExerciseCardProps) {
  const { dayWorkout: tCard } = useT()
  const localizeName = useLocalizedExerciseName()
  const pct = exercise.sets.length > 0
    ? Math.round((exercise.completedSetsCount / exercise.sets.length) * 100)
    : 0

  const hasUnderperformed = hasWarningExercise(exercise)
  const isCardio = exercise.exerciseKind === 'Cardio'

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
          : { background: 'var(--bg-2)' }
      }
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {exercise.imageUrl && (
            <img
              src={`${import.meta.env.VITE_API_URL}${exercise.imageUrl}`}
              alt={exercise.name}
              className="mt-0.5 h-10 w-10 shrink-0 rounded-lg object-cover"
            />
          )}
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
            <h3 className="break-words font-semibold text-text">{localizeName(exercise.name)}</h3>
            {isCardio && <Badge variant="primary">Cardio</Badge>}
            {exercise.isCompleted && !hasUnderperformed && <Badge variant="success">{tCard.doneBadge} ✓</Badge>}
            {exercise.isCompleted && !isCardio && (exercise.durationSeconds ?? 0) > VALID_EXERCISE_DURATION_SECONDS && (() => {
              const xp = exercise.sets
                .filter(s => s.isCompleted)
                .reduce((sum, s) => {
                  const w = s.actualWeight ?? s.plannedWeight ?? 0
                  const r = s.actualReps ?? s.plannedReps
                  const base = Math.max(1, Math.floor(w / 2.5)) * r
                  return sum + (exercise.isCompetitionLift ? base * 2 : base)
                }, 0)
              return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--xn-clay-700)' }}>
                  +{xp.toLocaleString()} XP
                </span>
              )
            })()}
            {hasUnderperformed && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                <TriangleAlert size={12} /> {tCard.belowTargetBadge}
              </span>
            )}
            {exercise.personalRecordWeight != null && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                <Trophy size={11} /> PR {exercise.personalRecordWeight} kg
              </span>
            )}
          </div>
          <p className={cn('mt-0.5 text-sm text-muted', isCardio && 'hidden')}>
            {exercise.plannedSets}×{exercise.plannedReps}
            {exercise.plannedWeight ? ` @ ${exercise.plannedWeight} kg` : ''} · {exercise.primaryMuscleGroup}
          </p>
          {isCardio && (
            <p className="mt-0.5 text-sm text-muted">
              {formatDuration(exercise.durationSeconds)} · {exercise.estimatedMet} MET · {exercise.primaryMuscleGroup}
            </p>
          )}
          {exercise.notes && (
            <div
              className="mt-2 flex max-w-2xl items-start gap-2 rounded-lg border px-2.5 py-2 text-sm font-medium leading-snug"
              style={{
                background: 'rgba(245,158,11,0.10)',
                borderColor: 'rgba(245,158,11,0.28)',
                color: 'var(--fg-1)',
              }}
            >
              <MessageSquareText size={15} className="mt-0.5 shrink-0 text-warning" />
              <p className="break-words">{exercise.notes}</p>
            </div>
          )}
          </div>
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

      <ExerciseTimerControls
        exercise={exercise}
        canComplete={canComplete}
        pending={timerPending}
        onStart={onStartTimer}
        onFinish={onFinishTimer}
        onSetDuration={onSetDuration}
      />

      {/* Per-exercise progress bar */}
      <div className={cn('flex items-center gap-2', isCardio && 'opacity-60')}>
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
      <div className={cn('space-y-1.5', isCardio && 'opacity-70')}>
        {exercise.sets.map((set) => (
          <SetRow key={set.id} set={set} canComplete={canComplete} onComplete={onCompleteSet} isCardio={isCardio} />
        ))}
      </div>
    </motion.div>
  )
}

// ─── SetRow ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number | null | undefined) {
  const total = Math.max(0, seconds ?? 0)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60

  if (hours > 0) return `${hours}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  return `${remMins}:${String(secs).padStart(2, '0')}`
}

function ExerciseTimerControls({
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

interface SetRowProps {
  set: ExerciseSetResponse
  canComplete: boolean
  isCardio?: boolean
  onComplete: (setId: string, actualReps: number, actualWeight: number, rpe?: number) => void
}

function SetRow({ set, canComplete, isCardio = false, onComplete }: SetRowProps) {
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
