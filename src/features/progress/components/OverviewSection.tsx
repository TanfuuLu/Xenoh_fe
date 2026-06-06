import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, CheckCircle2, Dumbbell, Gauge, Target, TrendingUp, Weight, Zap } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { slideUp } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import type {
  MuscleGroupBalancePoint,
  MuscleGroupPoint,
  PlanAnalyticsResponse,
  TrainingInsightResponse,
} from '../types'
import {
  MUSCLE_COLORS,
  CHART_TOOLTIP_STYLE,
  TICK_STYLE,
  formatKg,
  translateMuscleGroup,
  translateWeekName,
  heatmapColor,
  insightStyle,
  localizeInsight,
} from './progressFormat'

export function OverviewSection({
  analytics,
  shouldReduce,
  tp,
}: {
  analytics: PlanAnalyticsResponse
  shouldReduce: boolean
  tp: Record<string, string>
}) {
  return (
    <div className="space-y-6">
          {/* Summary cards */}
          <motion.div
            initial={shouldReduce ? false : 'hidden'}
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            <ScoreCard score={analytics.trainingScore} shouldReduce={shouldReduce} tp={tp} />
            <StatCard icon={<Dumbbell size={18} />} label={tp.totalWorkouts} value={String(analytics.totalWorkoutsCompleted)} shouldReduce={shouldReduce} />
            <StatCard icon={<Weight size={18} />}   label={tp.totalVolume}   value={formatKg(analytics.totalVolume, tp)} shouldReduce={shouldReduce} />
            <StatCard icon={<Target size={18} />}   label={tp.consistency}   value={`${analytics.consistencyPercent}%`} shouldReduce={shouldReduce} />
          </motion.div>

          {analytics.insights.length > 0 && (
            <motion.div {...(shouldReduce ? {} : slideUp)}>
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <Zap size={17} style={{ color: '#f59e0b' }} />
                  <h2 className="text-base font-semibold text-text">{tp.trainingRecommendations}</h2>
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  {analytics.insights.slice(0, 3).map((insight) => (
                    <InsightCard key={`${insight.type}-${insight.title}`} insight={insight} />
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          <motion.div {...(shouldReduce ? {} : slideUp)}>
            <MuscleHeatmapPanel analytics={analytics} tp={tp} />
          </motion.div>

          {/* Weekly Compliance */}
          <motion.div {...(shouldReduce ? {} : slideUp)}>
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 size={17} style={{ color: '#22c55e' }} />
                <h2 className="text-base font-semibold text-text">{tp.weeklyCompliance}</h2>
              </div>
              {analytics.weeklyCompliance.length === 0 ? (
                <p className="text-sm text-muted">{tp.noData}</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.weeklyCompliance} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
                      <XAxis dataKey="weekName" tick={TICK_STYLE} interval="preserveStartEnd" tickLine={false} axisLine={false} tickFormatter={(value) => translateWeekName(String(value), tp)} />
                      <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        labelStyle={{ color: 'var(--fg-1)' }}
                        itemStyle={{ color: 'var(--fg-2)' }}
                        labelFormatter={(label) => translateWeekName(String(label), tp)}
                        formatter={(value, name) => [value, name === 'completedDays' ? tp.completed : tp.total]}
                      />
                      <Bar dataKey="totalDays" fill="var(--bg-3)" radius={[4, 4, 0, 0]} name="totalDays" />
                      <Bar dataKey="completedDays" fill="#22c55e" radius={[4, 4, 0, 0]} name="completedDays" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Weekly Volume */}
          <motion.div {...(shouldReduce ? {} : slideUp)}>
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp size={17} style={{ color: '#f59e0b' }} />
                <h2 className="text-base font-semibold text-text">{tp.weeklyVolume}</h2>
              </div>
              {analytics.weeklyVolume.length === 0 || analytics.weeklyVolume.every((w) => w.totalVolume === 0) ? (
                <p className="text-sm text-muted">{tp.noData}</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.weeklyVolume}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
                      <XAxis dataKey="weekName" tick={TICK_STYLE} interval="preserveStartEnd" tickLine={false} axisLine={false} tickFormatter={(value) => translateWeekName(String(value), tp)} />
                      <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} width={72} tickFormatter={(v: number) => formatKg(v, tp)} />
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        labelStyle={{ color: 'var(--fg-1)' }}
                        itemStyle={{ color: '#f59e0b' }}
                        labelFormatter={(label) => translateWeekName(String(label), tp)}
                        formatter={(value) => [formatKg(Number(value ?? 0), tp), tp.volume]}
                      />
                      <Line type="monotone" dataKey="totalVolume" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} activeDot={{ r: 5 }} name={tp.volume} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Muscle Group Analytics */}
          <motion.div {...(shouldReduce ? {} : slideUp)}>
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 size={17} style={{ color: '#6366f1' }} />
                <h2 className="text-base font-semibold text-text">{tp.muscleGroupVolume}</h2>
              </div>
              {analytics.muscleGroupVolume.length === 0 ? (
                <p className="text-sm text-muted">{tp.noData}</p>
              ) : (
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.muscleGroupVolume} margin={{ top: 4, right: 8, left: 8, bottom: 32 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
                      <XAxis
                        type="category"
                        dataKey="muscleGroup"
                        tick={{ ...TICK_STYLE, angle: -35, textAnchor: 'end', dy: 8 }}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        tickFormatter={(value) => translateMuscleGroup(String(value), tp)}
                      />
                      <YAxis
                        type="number"
                        tick={TICK_STYLE}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        tickFormatter={(v: number) => formatKg(v, tp)}
                        width={72}
                      />
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        labelStyle={{ color: 'var(--fg-1)' }}
                        itemStyle={{ color: 'var(--color-primary)' }}
                        labelFormatter={(label) => translateMuscleGroup(String(label), tp)}
                        formatter={(value) => [formatKg(Number(value ?? 0), tp), tp.weightedVolume]}
                      />
                      <Bar dataKey="totalVolume" radius={[4, 4, 0, 0]} name="totalVolume">
                        {analytics.muscleGroupVolume.map((entry, i) => (
                          <Cell key={i} fill={MUSCLE_COLORS[entry.muscleGroup] ?? '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {analytics.muscleGroupVolume.length > 0 && (
                <MuscleGroupVolumeList data={analytics.muscleGroupVolume} tp={tp} />
              )}
            </Card>
          </motion.div>
    </div>
  )
}

function MuscleGroupVolumeList({
  data,
  tp,
}: {
  data: MuscleGroupPoint[]
  tp: Record<string, string>
}) {
  return (
    <div className="mt-4 grid gap-2 md:grid-cols-2">
      {data.slice(0, 8).map((item) => (
        <div
          key={item.muscleGroup}
          className="rounded-xl px-3 py-2"
          style={{ background: 'var(--bg-3)', border: '1px solid var(--border-1)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-text">{translateMuscleGroup(item.muscleGroup, tp)}</span>
            <span className="text-xs text-muted">{item.percentOfTotal.toFixed(1)}%</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            <span>{formatKg(item.totalVolume, tp)}</span>
            <span>{item.completedSets} {tp.sets}</span>
            <span>{tp.primary}: {formatKg(item.primaryVolume, tp)}</span>
            <span>{tp.secondary}: {formatKg(item.secondaryVolume, tp)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function MuscleHeatmapPanel({
  analytics,
  tp,
}: {
  analytics: PlanAnalyticsResponse
  tp: Record<string, string>
}) {
  const rows = analytics.muscleGroupHeatmap
    .filter((row) => row.totalVolume > 0)
    .slice(0, 8)
  const activeWeeks = Array.from(
    new Map(
      rows
        .flatMap((row) => row.weeks)
        .map((week) => [week.weekNumber, week.weekName] as const),
    ),
  )
    .filter(([weekNumber]) => rows.some((row) =>
      (row.weeks.find((week) => week.weekNumber === weekNumber)?.volume ?? 0) > 0,
    ))
    .sort(([a], [b]) => a - b)
  const maxVolume = Math.max(0, ...rows.flatMap((row) => row.weeks.map((week) => week.volume)))
  const topWeek = activeWeeks
    .map(([weekNumber, weekName]) => ({
      weekNumber,
      weekName,
      total: rows.reduce((sum, row) =>
        sum + (row.weeks.find((week) => week.weekNumber === weekNumber)?.volume ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total)[0]

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target size={17} style={{ color: '#ec4899' }} />
          <div>
            <h2 className="text-base font-semibold text-text">{tp.muscleGroupHeatmap}</h2>
            {topWeek && (
              <p className="mt-1 text-xs text-muted">
                {translateWeekName(topWeek.weekName, tp)} leads at {formatKg(topWeek.total, tp)}
              </p>
            )}
        </div>
        </div>
        <div className="rounded-lg px-3 py-2 text-right text-xs" style={{ background: 'var(--bg-3)', border: '1px solid var(--border-1)' }}>
          <p className="font-semibold text-text">{tp.weightedVolume}</p>
          <p className="text-muted">completed weeks only</p>
        </div>
      </div>
      {rows.length === 0 || activeWeeks.length === 0 ? (
        <p className="text-sm text-muted">{tp.noData}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-1)' }}>
          <div
            className="grid min-w-max"
            style={{ gridTemplateColumns: `132px repeat(${activeWeeks.length}, 58px) 76px` }}
          >
            <div className="sticky left-0 z-20 flex h-9 items-center px-3 text-[11px] font-semibold text-muted" style={{ background: 'var(--bg-2)' }}>
              Muscle
            </div>
            {activeWeeks.map(([weekNumber, weekName]) => (
              <div key={weekNumber} className="flex h-9 items-center justify-center border-l px-1 text-center text-[11px] font-semibold text-muted" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
                {shortWeekName(translateWeekName(weekName, tp))}
              </div>
            ))}
            <div className="flex h-9 items-center justify-end border-l px-3 text-[11px] font-semibold text-muted" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
              Total
            </div>
            {rows.map((row) => (
              <div key={row.muscleGroup} className="contents">
                <div className="sticky left-0 z-10 flex h-11 items-center truncate border-t px-3 text-xs font-semibold text-text" style={{ background: 'var(--bg-2)', borderColor: 'var(--border-1)' }}>
                  {translateMuscleGroup(row.muscleGroup, tp)}
                </div>
                {activeWeeks.map(([weekNumber]) => {
                  const volume = row.weeks.find((week) => week.weekNumber === weekNumber)?.volume ?? 0
                  const ratio = maxVolume > 0 ? volume / maxVolume : 0
                  return (
                    <div
                      key={`${row.muscleGroup}-${weekNumber}`}
                      className="flex h-11 items-center justify-center border-l border-t px-1 text-center font-semibold tabular-nums"
                      style={{
                        background: heatmapColor(volume, maxVolume),
                        borderColor: 'var(--border-1)',
                        color: ratio >= 0.56 ? '#ffffff' : '#1f2937',
                      }}
                      title={`${translateMuscleGroup(row.muscleGroup, tp)}: ${formatKg(volume, tp)}`}
                    >
                      <span className="whitespace-nowrap text-[11px] leading-none">
                        {volume > 0 ? formatHeatmapValue(volume) : '-'}
                      </span>
                    </div>
                  )
                })}
                <div className="flex h-11 items-center justify-end border-l border-t px-3 text-xs font-semibold tabular-nums text-text" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
                  {formatHeatmapValue(row.totalVolume)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <BodyBalanceDiagram balance={analytics.muscleGroupBalance} tp={tp} />
    </Card>
  )
}

function shortWeekName(name: string) {
  const match = /^(Week|Tuần)\s*(\d+)$/i.exec(name.trim())
  return match ? `W${match[2]}` : name
}

function formatHeatmapValue(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`
  return Math.round(value).toLocaleString()
}

function BodyBalanceDiagram({
  balance,
  tp,
}: {
  balance: MuscleGroupBalancePoint
  tp: Record<string, string>
}) {
  const pairs = [
    [
      { label: tp.front, value: balance.frontVolume, color: '#6366f1' },
      { label: tp.back, value: balance.backVolume, color: '#22c55e' },
    ],
    [
      { label: tp.upper, value: balance.upperVolume, color: '#f97316' },
      { label: tp.lower, value: balance.lowerVolume, color: '#f59e0b' },
    ],
    [
      { label: tp.other, value: balance.otherVolume, color: '#94a3b8' },
    ],
  ]
  const maxVolume = Math.max(balance.maxVolume, 1)
  const hasVolume = balance.maxVolume > 0

  return (
    <div className="mt-5 rounded-xl p-4" style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Dumbbell size={17} style={{ color: '#06b6d4' }} />
          <div>
            <h3 className="text-sm font-semibold text-text">{tp.bodyHeatmap}</h3>
            <p className="mt-1 text-xs text-muted">{tp.muscleGroupVolume}</p>
          </div>
        </div>
      </div>
      {!hasVolume ? (
        <p className="text-sm text-muted">{tp.noData}</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-5">
          {pairs.flat().map((item) => (
            <div key={item.label} className="rounded-lg p-3" style={{ background: 'var(--bg-3)' }}>
              <div className="mb-2 flex items-start justify-between gap-2 text-xs">
                <span className="font-semibold text-text">{item.label}</span>
                <span className="text-right font-semibold tabular-nums text-text">{formatKg(item.value, tp)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--bg-1)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(3, (item.value / maxVolume) * 100)}%`,
                      background: item.color,
                    }}
                  />
                </div>
                <span className="w-9 text-right text-[11px] tabular-nums text-muted">
                  {Math.round((item.value / maxVolume) * 100)}%
                </span>
                  </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  shouldReduce,
}: {
  icon: React.ReactNode
  label: string
  value: string
  shouldReduce: boolean
}) {
  return (
    <motion.div
      variants={slideUp}
      initial={shouldReduce ? false : 'hidden'}
      animate="visible"
      className="rounded-2xl p-4"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
    >
      <div className="mb-2 flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
        {icon}
        <span className="text-xs font-medium text-muted">{label}</span>
      </div>
      <p className="text-2xl font-bold text-text">{value}</p>
    </motion.div>
  )
}

function ScoreCard({ score, shouldReduce, tp }: { score: number; shouldReduce: boolean; tp: Record<string, string> }) {
  const color = score >= 80 ? 'var(--color-success)' : score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)'
  return (
    <motion.div
      variants={slideUp}
      initial={shouldReduce ? false : 'hidden'}
      animate="visible"
      className="rounded-2xl p-4"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
    >
      <div className="mb-2 flex items-center gap-2" style={{ color }}>
        <Gauge size={18} />
        <span className="text-xs font-medium text-muted">{tp.trainingScore}</span>
      </div>
      <p className="text-2xl font-bold text-text">{score}/100</p>
    </motion.div>
  )
}

function InsightCard({ insight }: { insight: TrainingInsightResponse }) {
  const tp = useT().progress
  const styles = insightStyle(insight.severity)
  const Icon = styles.icon
  const localized = localizeInsight(insight, tp)
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: styles.border, background: styles.background }}
    >
      <div className="mb-3 flex items-start gap-2">
        <Icon size={18} style={{ color: styles.color, marginTop: 2, flexShrink: 0 }} />
        <div className="min-w-0">
          <p className="font-semibold text-text">{localized.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{localized.message}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--bg-2)', color: 'var(--fg-2)' }}>
          <span className="text-muted">{localized.metricLabel}: </span>
          <span className="font-semibold">{localized.metricValue}</span>
        </div>
        <div className="rounded-lg px-3 py-2 text-xs leading-relaxed" style={{ background: 'var(--bg-2)', color: 'var(--fg-2)' }}>
          <span className="font-semibold text-text">{tp.nextAction ?? 'Next action'}: </span>
          <span>{localized.action}</span>
        </div>
      </div>
    </div>
  )
}
