import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { LiftE1RmPoint, LiftSeries } from '../../types'

const TICK_STYLE = { fill: 'var(--fg-3)', fontSize: 11 }

const TOOLTIP_STYLE = {
  background: 'var(--bg-2)',
  border: '1px solid var(--border-1)',
  borderRadius: 8,
  fontSize: 12,
}

interface Props {
  squat: LiftSeries
  bench: LiftSeries
  deadlift: LiftSeries
}

interface CombinedPoint {
  weekStart: string
  Squat?: number
  Bench?: number
  Deadlift?: number
}

export function LiftTrendChart({ squat, bench, deadlift }: Props) {
  const data = useMemo(() => combine(squat.e1Rm, bench.e1Rm, deadlift.e1Rm), [squat, bench, deadlift])

  if (data.length === 0) {
    return <p className="text-sm text-muted">No e1RM data yet.</p>
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
          <XAxis dataKey="weekStart" tick={TICK_STYLE} interval="preserveStartEnd" tickLine={false} axisLine={false} />
          <YAxis
            tick={TICK_STYLE}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => `${Math.round(v)}`}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: 'var(--fg-1)' }}
            itemStyle={{ color: 'var(--fg-2)' }}
            formatter={(v) => [`${Number(v ?? 0).toFixed(1)} kg`, '']}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: 'var(--fg-3)' }} />
          <Line type="monotone" dataKey="Squat" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
          <Line type="monotone" dataKey="Bench" stroke="var(--color-warning)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
          <Line type="monotone" dataKey="Deadlift" stroke="var(--color-success)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function combine(
  squat: LiftE1RmPoint[],
  bench: LiftE1RmPoint[],
  deadlift: LiftE1RmPoint[],
): CombinedPoint[] {
  const map = new Map<string, CombinedPoint>()

  function ensure(weekStart: string) {
    const existing = map.get(weekStart)
    if (existing) return existing
    const fresh: CombinedPoint = { weekStart }
    map.set(weekStart, fresh)
    return fresh
  }

  for (const p of squat) ensure(p.weekStart).Squat = p.e1Rm
  for (const p of bench) ensure(p.weekStart).Bench = p.e1Rm
  for (const p of deadlift) ensure(p.weekStart).Deadlift = p.e1Rm

  return Array.from(map.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart))
}
