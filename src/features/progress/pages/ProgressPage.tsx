import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
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
import { AlertTriangle, BarChart3, CheckCircle2, Dumbbell, Gauge, Info, Sparkles, Target, TrendingUp, Weight, Users, Zap } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Badge } from '@/shared/components/Badge'
import { Select } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import { cn } from '@/shared/utils/cn'
import { slideUp } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import { useAuthStore } from '@/features/auth'
import { AiInsightsPanel } from '@/features/insights'
import { usePlans, useCoachPlanOverview } from '@/features/plans'
import { useMyClients } from '@/features/coach-client'
import { RequireTier } from '@/features/billing/components/RequireTier'
import { usePlanAnalytics } from '../api/usePlanAnalytics'
import { useClientPowerlifting } from '../api/useClientPowerlifting'
import { PowerliftingPanel } from '../components/powerlifting/PowerliftingPanel'
import { InlineTip } from '@/features/tips'
import type {
  MuscleGroupBalancePoint,
  MuscleGroupPoint,
  PlanAnalyticsResponse,
  PowerliftingSection,
  TrainingInsightResponse,
  TrainingInsightSeverity,
} from '../types'

type ProgressTab = 'overview' | 'powerlifting'
type ProgressInsightMode = 'overview' | 'powerlifting'

const CHART_TOOLTIP_STYLE = {
  background: 'var(--bg-2)',
  border: '1px solid var(--border-1)',
  borderRadius: 8,
  fontSize: 12,
}
const TICK_STYLE = { fill: 'var(--fg-3)', fontSize: 11 }

export function ProgressPage() {
  const shouldReduce = useReducedMotion()
  const t = useT()
  const tp = t.progress
  const tc = t.common

  const isCoach = useAuthStore((s) => s.user?.roles?.includes('Coach') ?? false)

  return (
    <RequireTier feature="Progress & Analytics">
      {isCoach ? (
        <CoachProgressView shouldReduce={!!shouldReduce} tp={tp} tc={tc} />
      ) : (
        <IndividualProgressView shouldReduce={!!shouldReduce} tp={tp} tc={tc} />
      )}
    </RequireTier>
  )
}

// ─── Individual view ─────────────────────────────────────────────────────────

function IndividualProgressView({
  shouldReduce,
  tp,
  tc,
}: {
  shouldReduce: boolean
  tp: Record<string, string>
  tc: Record<string, string>
}) {
  const { data: plans, isLoading: loadingPlans } = usePlans()
  const activePlan = plans?.find((p) => p.isActive)
  const [selectedPlanId, setSelectedPlanId] = useState('')

  useEffect(() => {
    if (!selectedPlanId && plans && plans.length > 0) {
      setSelectedPlanId(activePlan?.id ?? plans[0].id)
    }
  }, [plans, activePlan, selectedPlanId])

  const { data: analytics, isLoading: loadingAnalytics, isError } = usePlanAnalytics(
    selectedPlanId || null,
  )

  const isLoading = loadingPlans || (!!selectedPlanId && loadingAnalytics)

  return (
    <ProgressShell
      title={tp.title}
      subtitle={tp.subtitle}
      shouldReduce={shouldReduce}
      isLoading={isLoading}
      isError={isError}
      analytics={analytics}
      powerlifting={analytics?.powerlifting ?? null}
      tp={tp}
      planSelector={
        plans && plans.length > 0 ? (
          <PlanSelect
            plans={plans.map((p) => ({ id: p.id, name: p.name, isActive: p.isActive }))}
            value={selectedPlanId}
            onChange={setSelectedPlanId}
            activeLabel={tc.active}
          />
        ) : undefined
      }
      emptyNode={
        !loadingPlans && (!plans || plans.length === 0) ? (
          <Card><p className="py-8 text-center text-sm text-muted">{tp.noPlans}</p></Card>
        ) : undefined
      }
    />
  )
}

// ─── Coach view ───────────────────────────────────────────────────────────────

function CoachProgressView({
  shouldReduce,
  tp,
  tc,
}: {
  shouldReduce: boolean
  tp: Record<string, string>
  tc: Record<string, string>
}) {
  const { data: clients, isLoading: loadingClients } = useMyClients()
  const { data: coachPlans, isLoading: loadingCoachPlans } = useCoachPlanOverview()

  const activeClients = useMemo(
    () => clients?.filter((c) => c.status === 'Active') ?? [],
    [clients],
  )

  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')

  // Default to first active client
  useEffect(() => {
    if (!selectedClientId && activeClients.length > 0) {
      setSelectedClientId(activeClients[0].clientId)
    }
  }, [activeClients, selectedClientId])

  // When client changes, reset plan and default to their first plan
  const clientPlans = useMemo(
    () => coachPlans?.filter((p) => p.ownerId === selectedClientId) ?? [],
    [coachPlans, selectedClientId],
  )

  useEffect(() => {
    setSelectedPlanId(clientPlans[0]?.id ?? '')
  }, [clientPlans])

  // Once coachPlans load, set the first plan for the selected client
  useEffect(() => {
    if (!selectedPlanId && clientPlans.length > 0) {
      setSelectedPlanId(clientPlans[0].id)
    }
  }, [clientPlans, selectedPlanId])

  const { data: analytics, isLoading: loadingAnalytics, isError } = usePlanAnalytics(
    selectedPlanId || null,
  )

  // Coach powerlifting view is longitudinal across all plans for the selected client.
  const { data: powerliftingData } = useClientPowerlifting(selectedClientId || null)

  const isLoading = loadingClients || loadingCoachPlans || (!!selectedPlanId && loadingAnalytics)
  const noClients = !loadingClients && activeClients.length === 0

  return (
    <ProgressShell
      title={tp.title}
      subtitle={tp.subtitleCoach}
      shouldReduce={shouldReduce}
      isLoading={isLoading}
      isError={isError}
      analytics={analytics}
      powerlifting={powerliftingData?.powerlifting ?? analytics?.powerlifting ?? null}
      tp={tp}
      planSelector={
        activeClients.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {/* Client selector */}
            <div className="flex items-center gap-2">
              <Users size={15} style={{ color: 'var(--fg-3)' }} />
              <Select
                options={activeClients.map((c) => ({ value: c.clientId, label: c.fullName }))}
                value={selectedClientId}
                onChange={setSelectedClientId}
                className="min-w-40"
              />
            </div>

            {/* Plan selector for selected client */}
            {clientPlans.length > 0 && (
              <PlanSelect
                plans={clientPlans.map((p) => ({ id: p.id, name: p.name, isActive: false }))}
                value={selectedPlanId}
                onChange={setSelectedPlanId}
                activeLabel={tc.active}
              />
            )}
          </div>
        ) : undefined
      }
      emptyNode={
        noClients ? (
          <Card><p className="py-8 text-center text-sm text-muted">{tp.noClients}</p></Card>
        ) : !loadingCoachPlans && selectedClientId && clientPlans.length === 0 ? (
          <Card><p className="py-8 text-center text-sm text-muted">{tp.noClientPlans}</p></Card>
        ) : undefined
      }
    />
  )
}

// ─── Shared shell ─────────────────────────────────────────────────────────────

function ProgressShell({
  title,
  subtitle,
  shouldReduce,
  isLoading,
  isError,
  analytics,
  powerlifting,
  tp,
  planSelector,
  emptyNode,
}: {
  title: string
  subtitle: string
  shouldReduce: boolean
  isLoading: boolean
  isError: boolean
  analytics: PlanAnalyticsResponse | undefined
  powerlifting?: PowerliftingSection | null
  tp: Record<string, string>
  planSelector?: React.ReactNode
  emptyNode?: React.ReactNode
}) {
  const [tab, setTab] = useState<ProgressTab>('overview')
  const [insightMode, setInsightMode] = useState<ProgressInsightMode | null>(null)
  const hasPowerlifting = !!powerlifting

  // Reset to overview if user switches to a context without powerlifting data.
  useEffect(() => {
    if (!hasPowerlifting && tab === 'powerlifting') setTab('overview')
  }, [hasPowerlifting, tab])

  useEffect(() => {
    if (!hasPowerlifting && insightMode === 'powerlifting') setInsightMode(null)
  }, [hasPowerlifting, insightMode])

  return (
    <div className="space-y-6">
      {/* Header + selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TrendingUp size={22} style={{ color: 'var(--color-primary)' }} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text">{title}</h1>
              <InlineTip placement="progress" />
            </div>
            <p className="text-sm text-muted">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {planSelector}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={insightMode === 'overview' ? 'primary' : 'secondary'}
              onClick={() => setInsightMode((mode) => mode === 'overview' ? null : 'overview')}
            >
              <Sparkles size={15} />
              {tp.overviewInsight}
            </Button>
            {hasPowerlifting && (
              <Button
                type="button"
                size="sm"
                variant={insightMode === 'powerlifting' ? 'primary' : 'secondary'}
                onClick={() => setInsightMode((mode) => mode === 'powerlifting' ? null : 'powerlifting')}
              >
                <Dumbbell size={15} />
                {tp.powerliftingInsight}
              </Button>
            )}
          </div>
        </div>
      </div>

      {insightMode && (
        <motion.div {...(shouldReduce ? {} : slideUp)}>
          {insightMode === 'powerlifting' && powerlifting ? (
            <PowerliftingAiFocusPanel section={powerlifting} tp={tp} />
          ) : (
            <AiInsightsPanel
              sections={['trainingAdherence', 'bodyMetrics', 'volumeStrength', 'muscleBalance']}
            />
          )}
        </motion.div>
      )}

      {emptyNode}

      {!emptyNode && isLoading && (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {!emptyNode && !isLoading && isError && (
        <div
          className="rounded-xl px-5 py-4 text-sm"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: 'var(--color-danger)',
          }}
        >
          {tp.loadError}
        </div>
      )}

      {!emptyNode && !isLoading && !isError && analytics && (
        <>
          {hasPowerlifting && (
            <ProgressTabs current={tab} onChange={setTab} />
          )}

          {tab === 'powerlifting' && powerlifting ? (
            <PowerliftingPanel section={powerlifting} />
          ) : (
            <OverviewSection analytics={analytics} shouldReduce={shouldReduce} tp={tp} />
          )}
        </>
      )}
    </div>
  )
}

function ProgressTabs({
  current,
  onChange,
}: {
  current: ProgressTab
  onChange: (tab: ProgressTab) => void
}) {
  const tp = useT().progress
  const items: Array<{ id: ProgressTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: tp.overviewTab, icon: <BarChart3 size={14} /> },
    { id: 'powerlifting', label: tp.powerliftingTab, icon: <Dumbbell size={14} /> },
  ]
  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl p-1"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
    >
      {items.map((it) => {
        const active = current === it.id
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              active ? 'text-text' : 'text-muted hover:text-text',
            )}
            style={active ? { background: 'var(--bg-3)', border: '1px solid var(--border-1)' } : undefined}
          >
            {it.icon}
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

function OverviewSection({
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
                  <Zap size={17} style={{ color: 'var(--color-primary)' }} />
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
              <h2 className="mb-4 text-base font-semibold text-text">{tp.weeklyCompliance}</h2>
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
                      <Bar dataKey="completedDays" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="completedDays" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Weekly Volume */}
          <motion.div {...(shouldReduce ? {} : slideUp)}>
            <Card>
              <h2 className="mb-4 text-base font-semibold text-text">{tp.weeklyVolume}</h2>
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
                        itemStyle={{ color: 'var(--color-primary)' }}
                        labelFormatter={(label) => translateWeekName(String(label), tp)}
                        formatter={(value) => [formatKg(Number(value ?? 0), tp), tp.volume]}
                      />
                      <Line type="monotone" dataKey="totalVolume" stroke="var(--color-primary)" strokeWidth={2} dot={{ fill: 'var(--color-primary)', r: 3 }} activeDot={{ r: 5 }} name={tp.volume} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Muscle Group Analytics */}
          <motion.div {...(shouldReduce ? {} : slideUp)}>
            <Card>
              <h2 className="mb-4 text-base font-semibold text-text">{tp.muscleGroupVolume}</h2>
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
                        {analytics.muscleGroupVolume.map((_, i) => (
                          <Cell key={i} fill="var(--color-primary)" fillOpacity={Math.max(0.35, 1 - i * 0.06)} />
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-text">{tp.muscleGroupHeatmap}</h2>
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
      { label: tp.front, value: balance.frontVolume, color: 'var(--color-primary)' },
      { label: tp.back, value: balance.backVolume, color: 'var(--xn-success)' },
    ],
    [
      { label: tp.upper, value: balance.upperVolume, color: 'var(--xn-clay-700)' },
      { label: tp.lower, value: balance.lowerVolume, color: 'var(--xn-warning)' },
    ],
    [
      { label: tp.other, value: balance.otherVolume, color: 'var(--fg-3)' },
    ],
  ]
  const maxVolume = Math.max(balance.maxVolume, 1)
  const hasVolume = balance.maxVolume > 0

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-text">{tp.bodyHeatmap}</h2>
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

function formatKg(value: number, tp: Record<string, string>) {
  return `${Math.round(value).toLocaleString()} ${tp.kgUnit}`
}

function formatCompactKg(value: number, tp: Record<string, string>) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}${tp.tonneUnit}`
  return `${Math.round(value)}${tp.kgUnit}`
}

function translateMuscleGroup(name: string, tp: Record<string, string>) {
  const key = name.trim().toLowerCase().replace(/[\s_-]+/g, '')
  const map: Record<string, string> = {
    chest: tp.muscleChest,
    back: tp.muscleBack,
    shoulders: tp.muscleShoulders,
    shoulder: tp.muscleShoulders,
    biceps: tp.muscleBiceps,
    triceps: tp.muscleTriceps,
    quads: tp.muscleQuads,
    quadriceps: tp.muscleQuads,
    hamstrings: tp.muscleHamstrings,
    glutes: tp.muscleGlutes,
    calves: tp.muscleCalves,
    core: tp.muscleCore,
    abs: tp.muscleAbs,
    abdominals: tp.muscleAbs,
    forearms: tp.muscleForearms,
    traps: tp.muscleTraps,
    trapezius: tp.muscleTraps,
    lats: tp.muscleLats,
  }
  return map[key] ?? name
}

function translateWeekName(name: string, tp: Record<string, string>) {
  const match = /^week\s*(\d+)$/i.exec(name.trim())
  return match ? tp.weekLabel.replace('{n}', match[1]) : name
}

function heatmapColor(value: number, max: number) {
  if (value <= 0 || max <= 0) return 'var(--bg-3)'
  const intensity = Math.max(16, Math.round((value / max) * 88))
  return `color-mix(in srgb, var(--color-primary) ${intensity}%, var(--bg-3))`
}

function PlanSelect({
  plans,
  value,
  onChange,
  activeLabel,
}: {
  plans: { id: string; name: string; isActive: boolean }[]
  value: string
  onChange: (id: string) => void
  activeLabel: string
}) {
  return (
    <Select
      options={plans.map((p) => ({ value: p.id, label: p.isActive ? `${p.name} (${activeLabel})` : p.name }))}
      value={value}
      onChange={onChange}
      className="min-w-40"
    />
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

interface PowerliftingAiSummary {
  title: string
  detail: string
  priorityLift: string
  actions: string[]
  cards: Array<{ title: string; detail: string; metric: string }>
}

function PowerliftingAiFocusPanel({ section, tp }: { section: PowerliftingSection; tp: Record<string, string> }) {
  const summary = buildPowerliftingAiSummary(section, tp)

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-text">{tp.powerliftingAiTitle}</h2>
          <Badge>{tp.powerliftingTab}</Badge>
        </div>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
          <Target size={15} />
          {tp.powerliftingAiLabel}
        </div>
        <p className="mt-2 font-semibold text-text">{summary.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{summary.detail}</p>
        <ul className="mt-3 grid gap-2 md:grid-cols-3">
          {summary.actions.map((action) => (
            <li key={action} className="flex items-start gap-2 text-sm text-text">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
              <span className="leading-relaxed">{action}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {summary.cards.map((card) => (
          <div key={card.title} className="rounded-xl border p-4" style={{ background: 'var(--bg-2)', borderColor: 'var(--border-1)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{card.title}</p>
            <p className="mt-2 font-semibold text-text">{card.metric}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{card.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function buildPowerliftingAiSummary(section: PowerliftingSection, tp: Record<string, string>): PowerliftingAiSummary {
  const lifts = [section.squat, section.bench, section.deadlift]
  const plateauLift = lifts.find((lift) => lift.isPlateau)
  const squat = section.squat.currentE1Rm
  const bench = section.bench.currentE1Rm
  const deadlift = section.deadlift.currentE1Rm
  const benchRatio = squat && bench ? bench / squat : null
  const deadliftRatio = squat && deadlift ? deadlift / squat : null
  const allPrs = lifts
    .flatMap((lift) => lift.prTimeline.map((pr) => ({ ...pr, lift: lift.lift })))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  const latestDots = section.dots.length > 0 ? section.dots[section.dots.length - 1] : undefined

  let title = tp.powerliftingAiKeepBuilding
  let detail = tp.powerliftingAiKeepBuildingDetail
  let priorityLift = tp.squat

  if (!latestDots) {
    title = tp.powerliftingAiNeedBodyweight
    detail = tp.powerliftingAiNeedBodyweightDetail
  } else if (plateauLift) {
    priorityLift = translateLiftName(plateauLift.lift, tp)
    title = tp.powerliftingAiPlateau.replace('{lift}', priorityLift)
    detail = tp.powerliftingAiPlateauDetail.replace(/\{lift\}/g, priorityLift)
  } else if (benchRatio != null && benchRatio < 0.6) {
    priorityLift = tp.bench
    title = tp.powerliftingAiBenchLag
    detail = tp.powerliftingAiBenchLagDetail
  } else if (deadliftRatio != null && deadliftRatio < 1.05) {
    priorityLift = tp.deadlift
    title = tp.powerliftingAiDeadliftLag
    detail = tp.powerliftingAiDeadliftLagDetail
  }

  const latestPr = allPrs[0]
  const actions = [
    tp.powerliftingAiActionWeakLift.replace('{lift}', priorityLift),
    tp.powerliftingAiActionTechnique,
    latestDots ? tp.powerliftingAiActionPr : tp.powerliftingAiActionBodyweight,
  ]

  return {
    title,
    detail,
    priorityLift,
    actions,
    cards: [
      {
        title: tp.powerliftingBalanceTitle,
        metric: strongestLiftLabel(section, tp),
        detail: tp.powerliftingBalanceDetail
          .replace('{squat}', formatLiftValue(section.squat.currentE1Rm, tp))
          .replace('{bench}', formatLiftValue(section.bench.currentE1Rm, tp))
          .replace('{deadlift}', formatLiftValue(section.deadlift.currentE1Rm, tp)),
      },
      {
        title: tp.powerliftingPrTitle,
        metric: `${allPrs.length}`,
        detail: latestPr
          ? tp.powerliftingPrDetail
              .replace('{count}', String(allPrs.length))
              .replace('{latest}', `${translateLiftName(latestPr.lift, tp)} ${latestPr.e1Rm.toFixed(1)} ${tp.kgUnit}`)
          : tp.powerliftingNoPrDetail,
      },
      {
        title: tp.powerliftingDotsTitle,
        metric: latestDots ? latestDots.dots.toFixed(1) : '—',
        detail: latestDots
          ? tp.powerliftingDotsDetail
              .replace('{dots}', latestDots.dots.toFixed(1))
              .replace('{bodyweight}', latestDots.bodyweightKg.toFixed(1))
          : tp.powerliftingNoDotsDetail,
      },
    ],
  }
}

function strongestLiftLabel(section: PowerliftingSection, tp: Record<string, string>) {
  const lifts = [section.squat, section.bench, section.deadlift]
    .filter((lift) => lift.currentE1Rm != null)
    .sort((a, b) => (b.currentE1Rm ?? 0) - (a.currentE1Rm ?? 0))
  const top = lifts[0]
  return top ? `${translateLiftName(top.lift, tp)} ${formatLiftValue(top.currentE1Rm, tp)}` : '—'
}

function formatLiftValue(value: number | null, tp: Record<string, string>) {
  return value == null ? '—' : `${value.toFixed(1)} ${tp.kgUnit}`
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

function localizeInsight(insight: TrainingInsightResponse, tp: Record<string, string>) {
  const dynamicMuscle = translateMuscleGroup(insight.metricLabel, tp)
  const dynamicLift = translateLiftName(extractLiftName(insight.title), tp)
  const missingGroups = extractMissingGroups(insight.message).map((name) => translateMuscleGroup(name, tp)).join(', ')

  const titles: Record<string, string> = {
    'No training days planned': tp.insightNoTrainingDaysTitle,
    'Consistency needs attention': tp.insightConsistencyAttentionTitle,
    'Consistency is uneven': tp.insightConsistencyUnevenTitle,
    'Strong consistency': tp.insightStrongConsistencyTitle,
    'More volume history needed': tp.insightMoreVolumeTitle,
    'Volume dropped sharply': tp.insightVolumeDroppedTitle,
    'Volume is trending down': tp.insightVolumeDownTitle,
    'Large overload jump': tp.insightLargeOverloadTitle,
    'Progressive overload is moving': tp.insightOverloadMovingTitle,
    'Volume is stable': tp.insightVolumeStableTitle,
    'Fatigue risk is elevated': tp.insightFatigueElevatedTitle,
    'Some sets missed target': tp.insightSetsMissedTitle,
    'Training is heavily concentrated': tp.insightConcentratedTitle,
    'Muscle focus is unbalanced': tp.insightFocusUnbalancedTitle,
    'Major muscle gaps detected': tp.insightMajorGapsTitle,
    'Muscle distribution looks balanced': tp.insightBalancedTitle,
    'Repeat or simplify the week': tp.insightRepeatWeekTitle,
    'Prioritize recovery': tp.insightPrioritizeRecoveryTitle,
    'Progress gradually': tp.insightProgressGraduallyTitle,
    'Hold the plan steady': tp.insightHoldSteadyTitle,
    'Bench is lagging your squat': tp.insightBenchLagTitle,
    'Deadlift is below your squat': tp.insightDeadliftLowTitle,
    'Long stretch of high-RPE work': tp.insightHighRpeStretchTitle,
  }

  const messages: Record<string, string> = {
    'No training days planned': tp.insightNoTrainingDaysMsg,
    'Consistency needs attention': tp.insightConsistencyAttentionMsg,
    'Consistency is uneven': tp.insightConsistencyUnevenMsg,
    'Strong consistency': tp.insightStrongConsistencyMsg,
    'More volume history needed': tp.insightMoreVolumeMsg,
    'Volume dropped sharply': tp.insightVolumeDroppedMsg,
    'Volume is trending down': tp.insightVolumeDownMsg,
    'Large overload jump': tp.insightLargeOverloadMsg,
    'Progressive overload is moving': tp.insightOverloadMovingMsg,
    'Volume is stable': tp.insightVolumeStableMsg,
    'Fatigue risk is elevated': tp.insightFatigueElevatedMsg,
    'Some sets missed target': tp.insightSetsMissedMsg,
    'Training is heavily concentrated': tp.insightConcentratedMsg.replace('{muscle}', dynamicMuscle),
    'Muscle focus is unbalanced': tp.insightFocusUnbalancedMsg.replace('{muscle}', dynamicMuscle),
    'Major muscle gaps detected': tp.insightMajorGapsMsg.replace('{muscles}', missingGroups || insight.message),
    'Muscle distribution looks balanced': tp.insightBalancedMsg,
    'Repeat or simplify the week': tp.insightRepeatWeekMsg,
    'Prioritize recovery': tp.insightPrioritizeRecoveryMsg,
    'Progress gradually': tp.insightProgressGraduallyMsg,
    'Hold the plan steady': tp.insightHoldSteadyMsg,
    'Bench is lagging your squat': tp.insightBenchLagMsg,
    'Deadlift is below your squat': tp.insightDeadliftLowMsg,
    'Long stretch of high-RPE work': tp.insightHighRpeStretchMsg,
  }

  const isPlateau = /^(Squat|Bench|Deadlift) is plateauing$/.test(insight.title)
  const title = isPlateau
    ? tp.insightPlateauTitle.replace('{lift}', dynamicLift)
    : titles[insight.title] ?? insight.title
  const message = isPlateau
    ? tp.insightPlateauMsg.replace('{lift}', dynamicLift)
    : messages[insight.title] ?? insight.message

  return {
    title,
    message,
    metricLabel: translateMetricLabel(insight.metricLabel, tp),
    metricValue: insight.metricValue.replace(/\bkg\b/g, tp.kgUnit),
  }
}

function translateMetricLabel(label: string, tp: Record<string, string>) {
  const labels: Record<string, string> = {
    'Planned days': tp.metricPlannedDays,
    Completion: tp.completed,
    'Weeks logged': tp.metricWeeksLogged,
    'Volume change': tp.metricVolumeChange,
    'Avg RPE': tp.metricAvgRpe,
    'Warning days': tp.metricWarningDays,
    'Missing groups': tp.metricMissingGroups,
    'Top group': tp.metricTopGroup,
    'Training score': tp.trainingScore,
    'High-RPE sets': tp.metricHighRpeSets,
    'Current e1RM': tp.metricCurrentE1rm,
    'Bench / Squat': tp.metricBenchSquat,
    'Deadlift / Squat': tp.metricDeadliftSquat,
    'High-RPE weeks': tp.metricHighRpeWeeks,
  }
  return labels[label] ?? translateMuscleGroup(label, tp)
}

function extractLiftName(title: string) {
  const match = /^(Squat|Bench|Deadlift)\b/.exec(title)
  return match?.[1] ?? title
}

function translateLiftName(lift: string, tp: Record<string, string>) {
  if (lift === 'Squat') return tp.squat
  if (lift === 'Bench') return tp.bench
  if (lift === 'Deadlift') return tp.deadlift
  return lift
}

function extractMissingGroups(message: string) {
  const match = /for (.+)\./i.exec(message)
  return match ? match[1].split(',').map((part) => part.trim()).filter(Boolean) : []
}

function insightStyle(severity: TrainingInsightSeverity) {
  if (severity === 'Critical') {
    return {
      icon: AlertTriangle,
      color: 'var(--color-danger)',
      border: 'rgba(239,68,68,0.28)',
      background: 'rgba(239,68,68,0.08)',
    }
  }
  if (severity === 'Warning') {
    return {
      icon: AlertTriangle,
      color: 'var(--color-warning)',
      border: 'rgba(245,158,11,0.28)',
      background: 'rgba(245,158,11,0.08)',
    }
  }
  if (severity === 'Positive') {
    return {
      icon: CheckCircle2,
      color: 'var(--color-success)',
      border: 'rgba(34,197,94,0.25)',
      background: 'rgba(34,197,94,0.08)',
    }
  }
  return {
    icon: Info,
    color: 'var(--color-primary)',
    border: 'var(--border-1)',
    background: 'var(--bg-2)',
  }
}
