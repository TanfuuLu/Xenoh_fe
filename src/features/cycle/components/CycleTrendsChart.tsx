import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { TrendingUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/shared/components/Card'
import { useT } from '@/shared/i18n'
import type { CycleDailyLogResponse, CycleMood } from '../types'

interface Props {
  logs: CycleDailyLogResponse[]
}

const MOOD_SCORE: Record<CycleMood, number> = {
  Great: 5,
  Good: 4,
  Neutral: 3,
  Low: 2,
  Irritable: 1,
}

const TICK_STYLE = { fill: 'var(--fg-3)', fontSize: 11 }
const TOOLTIP_STYLE = {
  background: 'var(--bg-2)',
  border: '1px solid var(--border-1)',
  borderRadius: 8,
  color: 'var(--fg-1)',
  fontSize: 12,
}

export function CycleTrendsChart({ logs }: Props) {
  const t = useT()
  const tc = t.cycle

  const series = useMemo(
    () =>
      logs
        .filter((l) => l.energyLevel != null || l.mood != null)
        .map((l) => ({
          label: format(parseISO(l.date), 'd MMM'),
          energy: l.energyLevel,
          mood: l.mood ? MOOD_SCORE[l.mood] : null,
        })),
    [logs],
  )

  const symptomLabels = tc.symptoms
  const symptomFreq = useMemo(() => {
    const counts = new Map<string, number>()
    for (const log of logs) {
      for (const s of log.symptoms) counts.set(s, (counts.get(s) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([symptom, count]) => ({
        symptom,
        label: symptomLabels[symptom as keyof typeof symptomLabels] ?? symptom,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [logs, symptomLabels])

  const hasData = series.length > 0 || symptomFreq.length > 0

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-text">
        <TrendingUp size={17} style={{ color: '#f43f5e' }} />
        {tc.trends.title}
      </div>

      {!hasData ? (
        <p className="py-10 text-center text-sm text-muted">{tc.trends.noData}</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {series.length > 0 && (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                <LineChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
                  <XAxis dataKey="label" tick={TICK_STYLE} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} width={28} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="energy" name={tc.trends.energy} stroke="#22c55e" strokeWidth={2.5} dot={{ r: 2.5 }} connectNulls />
                  <Line type="monotone" dataKey="mood" name={tc.trends.mood} stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 2.5 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {symptomFreq.length > 0 && (
            <div className="flex h-56 flex-col">
              <p className="mb-1 text-xs font-medium text-muted">{tc.trends.symptomFrequency}</p>
              <div className="min-h-0 flex-1">
                <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                  <BarChart data={symptomFreq} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" horizontal={false} />
                  <XAxis type="number" tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" tick={TICK_STYLE} tickLine={false} axisLine={false} width={96} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--bg-3)' }} />
                  <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
