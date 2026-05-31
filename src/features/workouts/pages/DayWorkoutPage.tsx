import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronLeft, Plus, Dumbbell, Copy, AlertTriangle, BedDouble, XCircle } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { vi as viLocale, enUS } from 'date-fns/locale'
import { Button } from '@/shared/components/Button'
import { Spinner } from '@/shared/components/Spinner'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { staggerContainer, scaleIn } from '@/shared/utils/motion'
import { cn } from '@/shared/utils/cn'
import { useT, useLangStore } from '@/shared/i18n'
import type { DayStatus, MuscleGroup as MuscleGroupValue } from '@/shared/types/api'
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
import type { ExerciseResponse } from '../types'
import { InlineTip } from '@/features/tips'
import { SessionSummaryBar } from '../components/SessionSummaryBar'
import { ExerciseCard } from '../components/ExerciseCard'
import { ExercisePicker } from '../components/ExercisePicker'
import { DayResultCard } from '../components/DayResultCard'
import { getExerciseVolume, hasWarningExercise } from '../components/dayWorkoutHelpers'

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  const {
    data: exercises,
    isLoading,
    isError: exercisesError,
    hasNextPage: hasMoreExercises,
    fetchNextPage: fetchMoreExercises,
    isFetchingNextPage: loadingMoreExercises,
  } = useExercises(dailyWorkoutId)

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
        {hasMoreExercises && (
          <div className="flex justify-center pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={loadingMoreExercises}
              onClick={() => void fetchMoreExercises()}
            >
              Load more exercises
            </Button>
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
