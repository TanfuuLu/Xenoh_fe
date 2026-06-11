import { Sparkles, Target, CheckCircle2, AlertTriangle, ArrowRight, TrendingUp, RefreshCw } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { CycleAwareBadge } from '@/shared/components/CycleAwareBadge'
import { Spinner } from '@/shared/components/Spinner'
import { usePlanProgressInsight } from '../api/usePlanProgressInsight'
import type { PlanProgressTrajectory } from '../types'

export function PlanProgressInsightPanel({ planId, tp }: { planId: string; tp: Record<string, string> }) {
  const { data, isLoading, isFetching, isError, refetch } = usePlanProgressInsight(planId)

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-muted">{tp.planInsightGenerating}</p>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card className="space-y-3 py-8 text-center">
        <p className="text-sm text-muted">{tp.planInsightError}</p>
        <Button type="button" size="sm" onClick={() => refetch()}>
          <RefreshCw size={14} />
          {tp.planInsightRetry}
        </Button>
      </Card>
    )
  }

  const trajectory = trajectoryStyle(data.trajectory, tp)

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-text">{tp.planInsightTitle}</h2>
          <Badge>{data.planName}</Badge>
          <CycleAwareBadge />
        </div>
        <Button type="button" size="sm" variant="secondary" disabled={isFetching} onClick={() => refetch()}>
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          {tp.planInsightRetry}
        </Button>
      </div>

      {/* Trajectory verdict */}
      <div
        className="rounded-xl p-4"
        style={{ background: trajectory.softBg, border: `1px solid ${trajectory.border}` }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: trajectory.color }}>
          <TrendingUp size={15} />
          {tp.planInsightLabel}
          <span
            className="ml-1 rounded-full px-2 py-0.5 text-[11px]"
            style={{ background: trajectory.iconBg, color: trajectory.color }}
          >
            {trajectory.label}
          </span>
        </div>
        <p className="mt-2 font-semibold text-text">{data.headline}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{data.summary}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <InsightList
          title={tp.planInsightWhatsWorking}
          items={data.whatsWorking}
          icon={<CheckCircle2 size={15} />}
          color="var(--xn-success)"
        />
        <InsightList
          title={tp.planInsightFocusAreas}
          items={data.focusAreas}
          icon={<AlertTriangle size={15} />}
          color="var(--xn-warning)"
        />
        <InsightList
          title={tp.planInsightNextBlock}
          items={data.nextBlock}
          icon={<ArrowRight size={15} />}
          color="var(--accent)"
        />
      </div>
    </Card>
  )
}

function InsightList({
  title,
  items,
  icon,
  color,
}: {
  title: string
  items: string[]
  icon: React.ReactNode
  color: string
}) {
  if (items.length === 0) return null

  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-2)', borderColor: 'var(--border-1)' }}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color }}>
        <Target size={14} />
        {title}
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-text">
            <span className="mt-0.5 shrink-0" style={{ color }}>{icon}</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function trajectoryStyle(trajectory: PlanProgressTrajectory, tp: Record<string, string>) {
  switch (trajectory) {
    case 'Improving':
      return {
        label: tp.trajectoryImproving,
        color: 'var(--xn-success)',
        iconBg: 'var(--xn-success-bg)',
        softBg: 'color-mix(in oklch, var(--bg-2) 80%, var(--xn-success-bg) 20%)',
        border: 'color-mix(in oklch, var(--xn-success) 45%, var(--border-1) 55%)',
      }
    case 'Declining':
      return {
        label: tp.trajectoryDeclining,
        color: 'var(--xn-warning)',
        iconBg: 'var(--xn-warning-bg)',
        softBg: 'color-mix(in oklch, var(--bg-2) 78%, var(--xn-warning-bg) 22%)',
        border: 'color-mix(in oklch, var(--xn-warning) 45%, var(--border-1) 55%)',
      }
    case 'TooEarly':
      return {
        label: tp.trajectoryTooEarly,
        color: 'var(--xn-info)',
        iconBg: 'var(--xn-info-bg)',
        softBg: 'color-mix(in oklch, var(--bg-2) 80%, var(--xn-info-bg) 20%)',
        border: 'color-mix(in oklch, var(--xn-info) 42%, var(--border-1) 58%)',
      }
    default:
      return {
        label: tp.trajectoryFlat,
        color: 'var(--accent)',
        iconBg: 'var(--accent-soft)',
        softBg: 'var(--accent-soft)',
        border: 'var(--accent)',
      }
  }
}
