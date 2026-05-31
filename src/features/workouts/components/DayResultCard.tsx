import type { ReactNode } from 'react'
import { CheckCircle2, TriangleAlert, Activity, Flame, Timer } from 'lucide-react'
import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'
import { useT } from '@/shared/i18n'
import { formatDuration } from './dayWorkoutHelpers'

interface DayResultCardProps {
  exerciseCount: number
  warningCount: number
  volume: number
  estimatedCalories: number
  totalDurationSeconds: number
  averageRpe: number | null
  embedded?: boolean
}

export function DayResultCard({ exerciseCount, warningCount, volume, estimatedCalories, totalDurationSeconds, averageRpe, embedded = false }: DayResultCardProps) {
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
