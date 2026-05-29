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
    <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-text">{ta.completion}</h2>
          <span className="text-xs" style={{ color: 'var(--fg-3)' }}>{ta.volumeVsPlan}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
          <div className="flex items-center justify-center">
            <div
              className="flex h-32 w-32 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(var(--color-primary) ${completionPct * 3.6}deg, var(--bg-3) 0deg)`,
              }}
            >
              <div
                className="flex h-24 w-24 flex-col items-center justify-center rounded-full"
                style={{ background: 'var(--bg-2)' }}
              >
                <span className="text-2xl font-bold text-text">{completionPct}%</span>
                <span className="text-[11px] text-muted">{ta.completion}</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
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
            <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-3)' }}>
              <span className="text-muted">{ta.volumeVsPlan}: </span>
              <span className="font-semibold text-text">{volumeRatio}%</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-text">{ta.volumeChart}</h2>
          <div className="flex flex-wrap gap-2 text-xs text-muted">
            <span>{ta.totalTime}: {totalDurationSeconds > 0 ? formatDuration(totalDurationSeconds) : '-'}</span>
            <span>{ta.avgRpe}: {weekAverageRpe != null ? weekAverageRpe.toFixed(1) : '-'}</span>
          </div>
        </div>
        <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
          {chartData.map((day) => {
            const dayVolumeRatio = day.planned > 0 ? Math.round((day.actual / day.planned) * 100) : 0
            const actualWidth = volumeBarWidth(day.actual, day.planned)
            const plannedWidth = day.planned > 0 ? 100 : Math.max(day.actual > 0 ? 4 : 0, (day.actual / maxLoad) * 100)
            const setPct = day.totalSets > 0 ? Math.round((day.completedSets / day.totalSets) * 100) : 0
            return (
              <div
                key={day.id}
                className="grid gap-2 rounded-xl p-3 sm:grid-cols-[76px_1fr_150px]"
                style={{ background: 'var(--bg-3)', border: day.hasWarning ? '1px solid var(--color-warning)' : '1px solid var(--border-1)' }}
              >
                <div>
                  <p className="text-sm font-semibold text-text">{day.day}</p>
                  <p className="text-xs text-muted">
                    {day.isRest ? ta.restDayLegend : day.status === 'Missed' ? ta.missedLegend : ta.trainingDays}
                  </p>
                </div>

                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-muted">
                      {ta.actual}: <span className="font-semibold text-text">{day.actual.toLocaleString()}</span>
                    </span>
                    <span className="text-muted">
                      {ta.planned}: <span className="font-semibold text-text">{day.planned.toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="relative h-4 overflow-hidden rounded-full" style={{ background: 'var(--bg-2)' }}>
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${plannedWidth}%`, background: 'var(--border-1)' }}
                    />
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${actualWidth}%`,
                        background: day.hasWarning ? 'var(--color-warning)' : 'var(--color-primary)',
                      }}
                    />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted">
                    <span>{ta.volumeVsPlan}: {dayVolumeRatio}%</span>
                    <span>{ta.kgReps}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-1">
                  <div className="rounded-lg px-2 py-1.5" style={{ background: 'var(--bg-2)' }}>
                    <p className="text-muted">{ta.completion}</p>
                    <p className="font-semibold text-text">{setPct}%</p>
                  </div>
                  <div className="rounded-lg px-2 py-1.5" style={{ background: 'var(--bg-2)' }}>
                    <p className="text-muted">{ta.avgRpe}</p>
                    <p className="font-semibold text-text">{day.avgRpe != null ? day.avgRpe.toFixed(1) : '-'}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--border-1)' }} />
            {ta.planned}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--color-primary)' }} />
            {ta.actual}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--color-warning)' }} />
            {ta.belowTargetLegend}
          </span>
        </div>
      </div>
    </div>
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
        <span className="text-muted">{value.toLocaleString()} {suffix}</span>
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
