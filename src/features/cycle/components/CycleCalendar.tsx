import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { Card } from '@/shared/components/Card'
import { useT } from '@/shared/i18n'
import { FLOW_FILL, PREDICTED_PERIOD_FILL } from './cycleColors'
import type { CycleDailyLogResponse, CycleOverviewResponse, FlowIntensity } from '../types'

interface Props {
  overview: CycleOverviewResponse | undefined
  logs: CycleDailyLogResponse[]
  onSelectDate: (date: string) => void
}

const KEY = 'yyyy-MM-dd'

function expandRange(start: string, end: string): string[] {
  try {
    return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).map((d) => format(d, KEY))
  } catch {
    return []
  }
}

export function CycleCalendar({ overview, logs, onSelectDate }: Props) {
  const t = useT()
  const tc = t.cycle
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const todayKey = format(new Date(), KEY)

  const flowByDate = useMemo(() => {
    const map = new Map<string, FlowIntensity>()
    for (const log of logs) {
      if (log.flow) map.set(log.date, log.flow)
    }
    return map
  }, [logs])

  const predictedSet = useMemo(() => {
    const s = new Set<string>()
    // Future predicted periods (next cycles).
    overview?.predictedPeriods.forEach((p) => expandRange(p.start, p.end).forEach((d) => s.add(d)))
    // Current period: extend from the logged start across the expected period length,
    // so logging day 1 auto-fills the remaining ~5 days as predicted.
    if (overview?.lastPeriodStart) {
      const start = parseISO(overview.lastPeriodStart)
      const end = addDays(start, Math.max(1, overview.effectivePeriodLengthDays) - 1)
      expandRange(format(start, KEY), format(end, KEY)).forEach((d) => s.add(d))
    }
    return s
  }, [overview])

  const fertileSet = useMemo(() => {
    const s = new Set<string>()
    overview?.fertileWindows.forEach((w) => expandRange(w.start, w.end).forEach((d) => s.add(d)))
    return s
  }, [overview])

  const ovulationSet = useMemo(() => new Set(overview?.ovulationDates ?? []), [overview])

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [month])

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text">{format(month, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="rounded p-1.5 text-muted transition hover:bg-[var(--bg-3)] hover:text-text"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setMonth(startOfMonth(new Date()))}
            className="rounded px-2 py-1 text-xs text-muted transition hover:bg-[var(--bg-3)] hover:text-text"
          >
            {tc.hero.today}
          </button>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="rounded p-1.5 text-muted transition hover:bg-[var(--bg-3)] hover:text-text"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {tc.calendar.weekdays.map((wd) => (
          <div key={wd} className="py-1 text-center text-xs font-medium text-muted">
            {wd}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, KEY)
          const inMonth = isSameMonth(day, month)
          const flow = flowByDate.get(key)
          const isPredicted = !flow && predictedSet.has(key)
          const isFertile = fertileSet.has(key)
          const isOvulation = ovulationSet.has(key)
          const isToday = key === todayKey

          const bg = flow
            ? FLOW_FILL[flow]
            : isPredicted
              ? PREDICTED_PERIOD_FILL
              : isFertile
                ? 'rgba(6, 182, 212, 0.12)'
                : 'var(--bg-2)'
          const textColor = flow && (flow === 'Heavy' || flow === 'Medium') ? '#fff' : 'var(--fg-1)'

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
              className="relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition-transform hover:scale-[1.04]"
              style={{
                background: bg,
                opacity: inMonth ? 1 : 0.4,
                color: textColor,
                borderColor: isToday ? 'var(--accent, #f43f5e)' : 'var(--border-1)',
                borderWidth: isToday ? 2 : 1,
                borderStyle: 'solid',
              }}
            >
              <span className="font-medium">{format(day, 'd')}</span>
              {isOvulation && (
                <span
                  className="absolute bottom-1 h-1.5 w-1.5 rounded-full"
                  style={{ background: '#06b6d4' }}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
        <Legend color="rgba(244, 63, 94, 0.85)" label={tc.calendar.legendPeriod} />
        <Legend color={PREDICTED_PERIOD_FILL} label={tc.calendar.legendPredicted} />
        <Legend color="#06b6d4" dot label={tc.calendar.legendOvulation} />
        <Legend color="rgba(6, 182, 212, 0.25)" label={tc.calendar.legendFertile} />
      </div>
    </Card>
  )
}

function Legend({
  color,
  border,
  dashed,
  dot,
  label,
}: {
  color: string
  border?: string
  dashed?: boolean
  dot?: boolean
  label: string
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={dot ? 'h-2 w-2 rounded-full' : 'h-3 w-3 rounded'}
        style={{
          background: color,
          border: border ? `1px ${dashed ? 'dashed' : 'solid'} ${border}` : undefined,
        }}
      />
      {label}
    </span>
  )
}
