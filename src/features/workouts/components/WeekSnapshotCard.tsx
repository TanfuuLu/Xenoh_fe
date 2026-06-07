import { Link } from 'react-router'
import { TrendingUp, Layers, Timer, BarChart2, ChevronRight } from 'lucide-react'
import { Spinner } from '@/shared/components/Spinner'
import { useT } from '@/shared/i18n'
import { useWeekExercises } from '../index'
import { calcActualVolume, calcTotalDuration, formatDuration } from './weekAnalyzeHelpers'

interface Props {
  weekId: string
  planId: string
}

/**
 * Compact, free-tier summary of a week's training shown beside the comments.
 * Three quick numbers + a link into the full (Pro) Week Analyze page.
 */
export function WeekSnapshotCard({ weekId, planId }: Props) {
  const t = useT()
  const tw = t.weekDetail
  const { data: exercises, isLoading } = useWeekExercises(weekId)

  const list = exercises ?? []
  const volume = Math.round(calcActualVolume(list))
  const allSets = list.flatMap((ex) => ex.sets)
  const completedSets = allSets.filter((s) => s.isCompleted).length
  const totalSets = allSets.length

  const totalDuration = calcTotalDuration(list)

  const isEmpty = !isLoading && list.length === 0

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: 'var(--bg-2)', borderColor: 'var(--border-1)' }}
    >
      <div className="flex items-center gap-2">
        <BarChart2 size={16} style={{ color: 'var(--color-primary)' }} />
        <h2 className="text-sm font-semibold text-text">{tw.snapshotTitle}</h2>
      </div>

      {isLoading ? (
        <div className="flex h-28 items-center justify-center">
          <Spinner size="md" />
        </div>
      ) : isEmpty ? (
        <p className="py-6 text-center text-sm text-muted">{tw.snapshotEmpty}</p>
      ) : (
        <dl className="mt-4 space-y-3">
          <SnapshotRow
            icon={<TrendingUp size={15} />}
            label={tw.snapshotVolume}
            value={volume.toLocaleString()}
            unit={tw.snapshotUnit}
          />
          <SnapshotRow
            icon={<Layers size={15} />}
            label={tw.snapshotSets}
            value={`${completedSets}/${totalSets}`}
          />
          <SnapshotRow
            icon={<Timer size={15} />}
            label={tw.snapshotTime}
            value={totalDuration > 0 ? formatDuration(totalDuration) : '—'}
          />
        </dl>
      )}

      <Link
        to={`/plans/${planId}/weeks/${weekId}/analyze`}
        className="mt-4 flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition-opacity hover:opacity-80"
        style={{ background: 'var(--bg-3)', color: 'var(--fg-1)' }}
      >
        {tw.snapshotFull}
        <ChevronRight size={14} />
      </Link>
    </div>
  )
}

interface RowProps {
  icon: React.ReactNode
  label: string
  value: string
  unit?: string
}

function SnapshotRow({ icon, label, value, unit }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-sm text-muted">
        <span style={{ color: 'var(--fg-3)' }}>{icon}</span>
        {label}
      </dt>
      <dd className="flex items-baseline gap-1 text-right">
        <span className="text-lg font-bold text-text tabular-nums">{value}</span>
        {unit && <span className="text-xs text-muted">{unit}</span>}
      </dd>
    </div>
  )
}
