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
import { AlertTriangle, BarChart3, CheckCircle2, Dumbbell, Gauge, Info, Target, TrendingUp, Weight, Users, Zap } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { Select } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import { cn } from '@/shared/utils/cn'
import { slideUp } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import { useAuthStore } from '@/features/auth'
import { usePlans, useCoachPlanOverview } from '@/features/plans'
import { useMyClients } from '@/features/coach-client'
import { RequireTier } from '@/features/billing/components/RequireTier'
import { usePlanAnalytics } from '../api/usePlanAnalytics'
import { useClientPowerlifting } from '../api/useClientPowerlifting'
import { PowerliftingPanel } from '../components/powerlifting/PowerliftingPanel'
import { InlineTip } from '@/features/tips'
import type { MuscleGroupPoint, PlanAnalyticsResponse, PowerliftingSection, TrainingInsightResponse, TrainingInsightSeverity } from '../types'

type ProgressTab = 'overview' | 'powerlifting'

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
  const hasPowerlifting = !!powerlifting

  // Reset to overview if user switches to a context without powerlifting data.
  useEffect(() => {
    if (!hasPowerlifting && tab === 'powerlifting') setTab('overview')
  }, [hasPowerlifting, tab])

  return (
    <div className="space-y-6">
      {/* Header + selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TrendingUp size={22} style={{ color: 'var(--color-primary)' }} />
          <div>
            <h1 className="text-2xl font-bold text-text">{title}</h1>
            <p className="text-sm text-muted">{subtitle}</p>
          </div>
        </div>
        {planSelector}
      </div>

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
          Could not load analytics.
        </div>
      )}

      {!emptyNode && !isLoading && !isError && analytics && (
        <>
          {hasPowerlifting && (
            <ProgressTabs current={tab} onChange={setTab} />
          )}

          {tab === 'powerlifting' && powerlifting ? (
            <>
              <InlineTip placement="progress" />
              <PowerliftingPanel section={powerlifting} />
            </>
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
  const items: Array<{ id: ProgressTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={14} /> },
    { id: 'powerlifting', label: 'Powerlifting', icon: <Dumbbell size={14} /> },
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
            <ScoreCard score={analytics.trainingScore} shouldReduce={shouldReduce} />
            <StatCard icon={<Dumbbell size={18} />} label={tp.totalWorkouts} value={String(analytics.totalWorkoutsCompleted)} shouldReduce={shouldReduce} />
            <StatCard icon={<Weight size={18} />}   label={tp.totalVolume}   value={`${(analytics.totalVolume / 1000).toFixed(1)}t`} shouldReduce={shouldReduce} />
            <StatCard icon={<Target size={18} />}   label={tp.consistency}   value={`${analytics.consistencyPercent}%`} shouldReduce={shouldReduce} />
          </motion.div>

          {analytics.insights.length > 0 && (
            <motion.div {...(shouldReduce ? {} : slideUp)}>
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <Zap size={17} style={{ color: 'var(--color-primary)' }} />
                  <h2 className="text-base font-semibold text-text">Training recommendations</h2>
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  {analytics.insights.slice(0, 3).map((insight) => (
                    <InsightCard key={`${insight.type}-${insight.title}`} insight={insight} />
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

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
                      <XAxis dataKey="weekName" tick={TICK_STYLE} interval="preserveStartEnd" tickLine={false} axisLine={false} />
                      <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        labelStyle={{ color: 'var(--fg-1)' }}
                        itemStyle={{ color: 'var(--fg-2)' }}
                        formatter={(value, name) => [value, name === 'completedDays' ? 'Completed' : 'Total']}
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
                      <XAxis dataKey="weekName" tick={TICK_STYLE} interval="preserveStartEnd" tickLine={false} axisLine={false} />
                      <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}t`} />
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        labelStyle={{ color: 'var(--fg-1)' }}
                        itemStyle={{ color: 'var(--color-primary)' }}
                        formatter={(value) => [`${Number(value ?? 0).toLocaleString()} kg`, 'Volume']}
                      />
                      <Line type="monotone" dataKey="totalVolume" stroke="var(--color-primary)" strokeWidth={2} dot={{ fill: 'var(--color-primary)', r: 3 }} activeDot={{ r: 5 }} name="Volume" />
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
                        formatter={(value) => [`${Number(value ?? 0).toLocaleString()} kg`, tp.weightedVolume]}
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
            <span className="text-sm font-medium text-text">{item.muscleGroup}</span>
            <span className="text-xs text-muted">{item.percentOfTotal.toFixed(1)}%</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            <span>{formatKg(item.totalVolume)}</span>
            <span>{item.completedSets} {tp.sets}</span>
            <span>{tp.primary}: {formatKg(item.primaryVolume)}</span>
            <span>{tp.secondary}: {formatKg(item.secondaryVolume)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatKg(value: number) {
  return `${Math.round(value).toLocaleString()} kg`
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

function ScoreCard({ score, shouldReduce }: { score: number; shouldReduce: boolean }) {
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
        <span className="text-xs font-medium text-muted">Training score</span>
      </div>
      <p className="text-2xl font-bold text-text">{score}/100</p>
    </motion.div>
  )
}

function InsightCard({ insight }: { insight: TrainingInsightResponse }) {
  const styles = insightStyle(insight.severity)
  const Icon = styles.icon
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: styles.border, background: styles.background }}
    >
      <div className="mb-3 flex items-start gap-2">
        <Icon size={18} style={{ color: styles.color, marginTop: 2, flexShrink: 0 }} />
        <div className="min-w-0">
          <p className="font-semibold text-text">{insight.title}</p>
          <p className="mt-1 text-sm text-muted">{insight.message}</p>
        </div>
      </div>
      <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--bg-2)', color: 'var(--fg-2)' }}>
        <span className="text-muted">{insight.metricLabel}: </span>
        <span className="font-semibold">{insight.metricValue}</span>
      </div>
    </div>
  )
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
