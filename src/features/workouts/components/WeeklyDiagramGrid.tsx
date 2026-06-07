import type { useT } from '@/shared/i18n'
import { type WeekChartPoint, formatDuration, volumeBarWidth } from './weekAnalyzeHelpers'

export function WeeklyDiagramGrid({
  chartData,
  completionPct,
  volumeRatio,
  totalActualVol,
  totalPlannedVol,
  totalDurationSeconds,
  weekAverageRpe,
  ta,
}: {
  chartData: WeekChartPoint[]
  completionPct: number
  volumeRatio: number
  totalActualVol: number
  totalPlannedVol: number
  totalDurationSeconds: number
  weekAverageRpe: number | null
  ta: ReturnType<typeof useT>['weekAnalyze']
}) {
  const maxLoad = Math.max(1, ...chartData.flatMap((day) => [day.actual, day.planned]))

  return (
    <div className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr] xl:items-start">
      {/* ── Completion summary ─────────────────────────────────────────── */}
      <div
        className="rounded-xl p-5"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
      >
        <h2 className="mb-4 text-sm font-semibold text-text">{ta.completion}</h2>

        {/* Ring */}
        <div className="flex flex-col items-center">
          <div
            className="flex h-36 w-36 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(var(--color-primary) ${completionPct * 3.6}deg, var(--bg-3) 0deg)`,
            }}
          >
            <div
              className="flex h-28 w-28 flex-col items-center justify-center rounded-full"
              style={{ background: 'var(--bg-2)' }}
            >
              <span className="text-3xl font-bold text-text">{completionPct}%</span>
              <span className="text-[11px] text-muted">{ta.completion}</span>
            </div>
          </div>
        </div>

        {/* Volume bars */}
        <div className="mt-5 space-y-3">
          <DiagramBar
            label={ta.actual}
            value={totalActualVol}
            max={Math.max(totalActualVol, totalPlannedVol, 1)}
            suffix={ta.kgReps}
            color="var(--color-primary)"
          />
          <DiagramBar
            label={ta.planned}
            value={totalPlannedVol}
            max={Math.max(totalActualVol, totalPlannedVol, 1)}
            suffix={ta.kgReps}
            color="var(--border-1)"
          />
        </div>

        <div
          className="mt-4 flex items-center justify-between rounded-lg px-3 py-2 text-sm"
          style={{ background: 'var(--bg-3)' }}
        >
          <span className="text-muted">{ta.volumeVsPlan}</span>
          <span className="font-bold text-text">{volumeRatio}%</span>
        </div>

        {/* Quick stats */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg px-3 py-2.5" style={{ background: 'var(--bg-3)' }}>
            <p className="text-[11px] text-muted">{ta.totalTime}</p>
            <p className="mt-0.5 text-base font-bold text-text tabular-nums">
              {totalDurationSeconds > 0 ? formatDuration(totalDurationSeconds) : '—'}
            </p>
          </div>
          <div className="rounded-lg px-3 py-2.5" style={{ background: 'var(--bg-3)' }}>
            <p className="text-[11px] text-muted">{ta.avgRpe}</p>
            <p className="mt-0.5 text-base font-bold text-text tabular-nums">
              {weekAverageRpe != null ? weekAverageRpe.toFixed(1) : '—'}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
          <LegendDot color="var(--border-1)" label={ta.planned} />
          <LegendDot color="var(--color-primary)" label={ta.actual} />
          <LegendDot color="var(--color-warning)" label={ta.belowTargetLegend} />
        </div>
      </div>

      {/* ── Per-day volume ─────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
      >
        <h2 className="mb-3 text-sm font-semibold text-text">{ta.volumeChart}</h2>

        <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
          {chartData.map((day) => {
            const dayVolumeRatio = day.planned > 0 ? Math.round((day.actual / day.planned) * 100) : 0
            const actualWidth = volumeBarWidth(day.actual, day.planned)
            const plannedWidth = day.planned > 0 ? 100 : Math.max(day.actual > 0 ? 4 : 0, (day.actual / maxLoad) * 100)
            const setPct = day.totalSets > 0 ? Math.round((day.completedSets / day.totalSets) * 100) : 0
            const accent = day.hasWarning ? 'var(--color-warning)' : 'var(--color-primary)'
            return (
              <div
                key={day.id}
                className="flex items-center gap-3 rounded-xl py-2.5 pl-3 pr-3"
                style={{
                  background: 'var(--bg-3)',
                  border: day.hasWarning ? '1px solid var(--color-warning)' : '1px solid var(--border-1)',
                }}
              >
                {/* Day */}
                <div className="w-16 shrink-0">
                  <p className="truncate text-sm font-semibold text-text">{day.day}</p>
                  <p className="truncate text-[11px] text-muted">
                    {day.isRest ? ta.restDayLegend : day.status === 'Missed' ? ta.missedLegend : ta.trainingDays}
                  </p>
                </div>

                {/* Bar + numbers */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted">
                      {ta.actual}: <span className="font-semibold text-text tabular-nums">{day.actual.toLocaleString()}</span>
                    </span>
                    <span className="text-muted">
                      {ta.planned}: <span className="font-semibold text-text tabular-nums">{day.planned.toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="relative h-3 overflow-hidden rounded-full" style={{ background: 'var(--bg-2)' }}>
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${plannedWidth}%`, background: 'var(--border-1)' }}
                    />
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-[width]"
                      style={{ width: `${actualWidth}%`, background: accent }}
                    />
                  </div>
                </div>

                {/* Inline stats */}
                <div className="flex shrink-0 gap-2">
                  <StatPill label={ta.volumeVsPlan} value={`${dayVolumeRatio}%`} accent={accent} />
                  <StatPill label={ta.completion} value={`${setPct}%`} />
                  <StatPill label={ta.avgRpe} value={day.avgRpe != null ? day.avgRpe.toFixed(1) : '—'} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatPill({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      title={`${label}: ${value}`}
      className="hidden w-[58px] rounded-lg px-2 py-1 text-center sm:block"
      style={{ background: 'var(--bg-2)' }}
    >
      <p className="truncate text-[10px] leading-tight text-muted">{label}</p>
      <p className="text-sm font-bold tabular-nums" style={{ color: accent ?? 'var(--fg-1)' }}>
        {value}
      </p>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  )
}

function DiagramBar({
  label,
  value,
  max,
  suffix,
  color,
}: {
  label: string
  value: number
  max: number
  suffix: string
  color: string
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-text">{label}</span>
        <span className="text-muted tabular-nums">{value.toLocaleString()} {suffix}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--bg-3)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(value > 0 ? 4 : 0, Math.min(100, (value / max) * 100))}%`, background: color }}
        />
      </div>
    </div>
  )
}
