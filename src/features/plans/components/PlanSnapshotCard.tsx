import { Link } from 'react-router'
import { BarChart2, CalendarDays, CheckCircle2, ChevronRight, Target } from 'lucide-react'
import { useT } from '@/shared/i18n'
import type { PlanResponse } from '../types'

interface Props {
  plan: PlanResponse
}

export function PlanSnapshotCard({ plan }: Props) {
  const t = useT()
  const tp = t.planDetail
  const completedWeeks = Math.min(plan.completedWeeks, plan.totalWeeks)
  const completedDays = Math.min(plan.completedDays, plan.totalDays)
  const progress = plan.totalDays > 0 ? Math.round((completedDays / plan.totalDays) * 100) : 0

  return (
    <div
      className="max-w-md rounded-2xl border p-5"
      style={{ background: 'var(--bg-2)', borderColor: 'var(--border-1)' }}
    >
      <div className="flex items-center gap-2">
        <BarChart2 size={16} style={{ color: 'var(--color-primary)' }} />
        <h2 className="text-sm font-semibold text-text">{tp.planSnapshotTitle}</h2>
      </div>

      <dl className="mt-4 space-y-3">
        <SnapshotRow
          icon={<CalendarDays size={15} />}
          label={tp.planSnapshotWeeks}
          value={`${completedWeeks}/${plan.totalWeeks}`}
        />
        <SnapshotRow
          icon={<CheckCircle2 size={15} />}
          label={tp.planSnapshotDays}
          value={`${completedDays}/${plan.totalDays}`}
        />
        <SnapshotRow
          icon={<Target size={15} />}
          label={tp.planSnapshotProgress}
          value={`${progress}%`}
        />
      </dl>

      <Link
        to={`/plans/${plan.id}/overview`}
        className="mt-4 flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition-opacity hover:opacity-80"
        style={{ background: 'var(--bg-3)', color: 'var(--fg-1)' }}
      >
        {tp.planSnapshotFull}
        <ChevronRight size={14} />
      </Link>
    </div>
  )
}

interface RowProps {
  icon: React.ReactNode
  label: string
  value: string
}

function SnapshotRow({ icon, label, value }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-sm text-muted">
        <span style={{ color: 'var(--fg-3)' }}>{icon}</span>
        {label}
      </dt>
      <dd className="text-lg font-bold text-text tabular-nums">{value}</dd>
    </div>
  )
}
