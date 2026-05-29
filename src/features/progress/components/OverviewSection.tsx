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
  formatCompactKg,
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
            <StatCard icon={<Weight size={18} />}   label={tp.totalVolume}   value={`${(analytics.totalVolume / 1000).toFixed(1)}${tp.tonneUnit}`} shouldReduce={shouldReduce} />
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
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <MuscleHeatmapPanel analytics={analytics} tp={tp} />
              <BodyBalanceDiagram balance={analytics.muscleGroupBalance} tp={tp} />
            </div>
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
                      <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}t`} />
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
                        tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${v}`}
                        width={44}
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
  const weeks = Array.from(
    new Map(
      rows
        .flatMap((row) => row.weeks)
        .map((week) => [week.weekNumber, week.weekName] as const),
    ),
  ).sort(([a], [b]) => a - b)
  const maxVolume = Math.max(0, ...rows.flatMap((row) => row.weeks.map((week) => week.volume)))

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target size={17} style={{ color: '#ec4899' }} />
          <h2 className="text-base font-semibold text-text">{tp.muscleGroupHeatmap}</h2>
        </div>
        <span className="text-xs text-muted">{tp.weightedVolume}</span>
      </div>
      {rows.length === 0 || weeks.length === 0 ? (
        <p className="text-sm text-muted">{tp.noData}</p>
      ) : (
        <div className="overflow-x-auto">
          <div
            className="grid min-w-[520px] gap-1.5"
            style={{ gridTemplateColumns: `minmax(92px, 1fr) repeat(${weeks.length}, minmax(42px, 56px))` }}
          >
            <div />
            {weeks.map(([weekNumber, weekName]) => (
              <div key={weekNumber} className="truncate text-center text-[11px] font-medium text-muted">
                {translateWeekName(weekName, tp)}
              </div>
            ))}
            {rows.map((row) => (
              <div key={row.muscleGroup} className="contents">
                <div className="truncate pr-2 text-xs font-medium text-text">{translateMuscleGroup(row.muscleGroup, tp)}</div>
                {weeks.map(([weekNumber]) => {
                  const volume = row.weeks.find((week) => week.weekNumber === weekNumber)?.volume ?? 0
                  return (
                    <div
                      key={`${row.muscleGroup}-${weekNumber}`}
                      className="flex h-9 items-center justify-center rounded-md text-[10px] font-semibold text-text"
                      style={{
                        background: heatmapColor(volume, maxVolume),
                        border: '1px solid var(--border-1)',
                      }}
                      title={`${translateMuscleGroup(row.muscleGroup, tp)}: ${formatKg(volume, tp)}`}
                    >
                      {volume > 0 ? formatCompactKg(volume, tp) : '-'}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
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
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Dumbbell size={17} style={{ color: '#06b6d4' }} />
          <h2 className="text-base font-semibold text-text">{tp.bodyHeatmap}</h2>
        </div>
        <span className="text-xs text-muted">{tp.muscleGroupVolume}</span>
      </div>
      {!hasVolume ? (
        <p className="text-sm text-muted">{tp.noData}</p>
      ) : (
        <div className="space-y-5">
          {pairs.map((pair) => (
            <div key={pair.map((item) => item.label).join('-')} className="space-y-3">
              {pair.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-text">{item.label}</span>
                    <span className="text-muted">{formatKg(item.value, tp)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full" style={{ background: 'var(--bg-3)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(4, (item.value / maxVolume) * 100)}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Card>
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
          <p className="mt-1 text-sm text-muted">{localized.message}</p>
        </div>
      </div>
      <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--bg-2)', color: 'var(--fg-2)' }}>
        <span className="text-muted">{localized.metricLabel}: </span>
        <span className="font-semibold">{localized.metricValue}</span>
      </div>
    </div>
  )
}
