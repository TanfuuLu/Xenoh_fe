import type { ReactNode } from 'react'
import { Activity, Timer, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { useT } from '@/shared/i18n'
import type { DayStatus } from '@/shared/types/api'
import { formatDuration } from './dayWorkoutHelpers'

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

export function SessionSummaryBar({
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
