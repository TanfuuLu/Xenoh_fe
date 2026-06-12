import type { DragEvent } from 'react'
import { motion } from 'framer-motion'
import {
  Ban,
  GripVertical,
  MessageSquareText,
  Pencil,
  RotateCcw,
  Trash2,
  Trophy,
  TriangleAlert,
} from 'lucide-react'
import { Badge } from '@/shared/components/Badge'
import { slideUp } from '@/shared/utils/motion'
import { cn } from '@/shared/utils/cn'
import { API_BASE_URL } from '@/shared/api/baseUrl'
import { useT } from '@/shared/i18n'
import { useLocalizedExerciseName } from '../exerciseNames'
import type { ExerciseResponse } from '../types'
import { SetRow } from './SetRow'
import { ExerciseTimerControls } from './ExerciseTimerControls'
import { formatDuration, hasWarningExercise, VALID_EXERCISE_DURATION_SECONDS } from './dayWorkoutHelpers'

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
  onEdit: () => void
  onSkip: (isSkipped: boolean) => void
  actionPending?: boolean
  onDelete: () => void
}

export function ExerciseCard({
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
  onEdit,
  onSkip,
  actionPending = false,
  onDelete,
}: ExerciseCardProps) {
  const { dayWorkout: tCard } = useT()
  const localizeName = useLocalizedExerciseName()
  const pct = exercise.sets.length > 0
    ? Math.round((exercise.completedSetsCount / exercise.sets.length) * 100)
    : 0

  const hasUnderperformed = !exercise.isSkipped && hasWarningExercise(exercise)
  const isCardio = exercise.exerciseKind === 'Cardio'
  const canCompleteSets = canComplete && !exercise.isSkipped

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
        exercise.isSkipped && 'opacity-80',
      )}
      style={
        hasUnderperformed
          ? { borderColor: 'var(--color-warning)', background: 'rgba(245,158,11,0.07)' }
          : exercise.isSkipped
          ? { borderColor: 'var(--xn-clay-400)', background: 'var(--xn-clay-100)' }
          : exercise.isCompleted
          ? { borderColor: 'var(--xn-sage-400)', background: 'var(--xn-sage-200)' }
          : { background: 'var(--bg-2)' }
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {exercise.imageUrl && (
            <img
              src={`${API_BASE_URL}${exercise.imageUrl}`}
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
              {exercise.isSkipped && <Badge variant="default">{tCard.skippedBadge}</Badge>}
              {exercise.isCompleted && !hasUnderperformed && <Badge variant="success">{tCard.doneBadge}</Badge>}
              {exercise.isCompleted && !exercise.isSkipped && !isCardio && (exercise.durationSeconds ?? 0) > VALID_EXERCISE_DURATION_SECONDS && (() => {
                const xp = exercise.sets
                  .filter((set) => set.isCompleted)
                  .reduce((sum, set) => {
                    const weight = set.actualWeight ?? set.plannedWeight ?? 0
                    const reps = set.actualReps ?? set.plannedReps
                    const base = Math.max(1, Math.floor(weight / 2.5)) * reps
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
              {exercise.plannedSets}x{exercise.plannedReps}
              {exercise.plannedWeight ? ` @ ${exercise.plannedWeight} kg` : ''} - {exercise.primaryMuscleGroup}
            </p>
            {isCardio && (
              <p className="mt-0.5 text-sm text-muted">
                {formatDuration(exercise.durationSeconds)} - {exercise.estimatedMet} MET - {exercise.primaryMuscleGroup}
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
        <div className="flex shrink-0 items-center gap-1">
          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg p-1.5 text-muted transition-colors hover:text-text"
              onMouseEnter={(event) => ((event.currentTarget as HTMLElement).style.background = 'var(--bg-3)')}
              onMouseLeave={(event) => ((event.currentTarget as HTMLElement).style.background = '')}
              title={tCard.editExercise}
            >
              <Pencil size={15} />
            </button>
          )}
          {canComplete && !exercise.isCompleted && (exercise.isSkipped || exercise.completedSetsCount === 0) && (
            <button
              type="button"
              onClick={() => onSkip(!exercise.isSkipped)}
              disabled={actionPending}
              className="rounded-lg p-1.5 text-muted transition-colors hover:text-warning disabled:cursor-not-allowed disabled:opacity-50"
              onMouseEnter={(event) => ((event.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.10)')}
              onMouseLeave={(event) => ((event.currentTarget as HTMLElement).style.background = '')}
              title={exercise.isSkipped ? tCard.unskipExercise : tCard.skipExercise}
            >
              {exercise.isSkipped ? <RotateCcw size={15} /> : <Ban size={15} />}
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg p-1.5 text-muted transition-colors hover:text-danger"
              onMouseEnter={(event) => ((event.currentTarget as HTMLElement).style.background = 'var(--xn-danger-bg)')}
              onMouseLeave={(event) => ((event.currentTarget as HTMLElement).style.background = '')}
              title={tCard.deleteExercise}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {!exercise.isSkipped && (
        <ExerciseTimerControls
          exercise={exercise}
          canComplete={canComplete}
          pending={timerPending}
          onStart={onStartTimer}
          onFinish={onFinishTimer}
          onSetDuration={onSetDuration}
        />
      )}

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

      <div className={cn('space-y-1.5', (isCardio || exercise.isSkipped) && 'opacity-70')}>
        {exercise.sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            canComplete={canCompleteSets}
            onComplete={onCompleteSet}
            isCardio={isCardio}
          />
        ))}
      </div>
    </motion.div>
  )
}
