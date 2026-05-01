import { useEffect, useState } from 'react'
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
import { CalendarDays, Dumbbell, Target, TrendingUp, Weight, Users } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { slideUp } from '@/shared/utils/motion'
import { cn } from '@/shared/utils/cn'
import { useT } from '@/shared/i18n'
import { useAuthStore } from '@/features/auth'
import { usePlans, useCoachPlanOverview } from '@/features/plans'
import { useMyClients } from '@/features/coach-client'
import { usePlanAnalytics } from '../api/usePlanAnalytics'

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

  return isCoach ? (
    <CoachProgressView shouldReduce={!!shouldReduce} tp={tp} tc={tc} />
  ) : (
    <IndividualProgressView shouldReduce={!!shouldReduce} tp={tp} tc={tc} />
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

  const activeClients = clients?.filter((c) => c.status === 'Active') ?? []

  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')

  // Default to first active client
  useEffect(() => {
    if (!selectedClientId && activeClients.length > 0) {
      setSelectedClientId(activeClients[0].clientId)
    }
  }, [activeClients, selectedClientId])

  // When client changes, reset plan and default to their first plan
  const clientPlans = coachPlans?.filter((p) => p.ownerId === selectedClientId) ?? []
  useEffect(() => {
    setSelectedPlanId(clientPlans[0]?.id ?? '')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId])

  // Once coachPlans load, set the first plan for the selected client
  useEffect(() => {
    if (!selectedPlanId && clientPlans.length > 0) {
      setSelectedPlanId(clientPlans[0].id)
    }
  }, [clientPlans, selectedPlanId])

  const { data: analytics, isLoading: loadingAnalytics, isError } = usePlanAnalytics(
    selectedPlanId || null,
  )

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
      tp={tp}
      planSelector={
        activeClients.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {/* Client selector */}
            <div className="flex items-center gap-2">
              <Users size={15} style={{ color: 'var(--fg-3)' }} />
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className={cn('rounded-xl border px-3 py-2 text-sm font-medium outline-none bg-surface text-text')}
                style={{ borderColor: 'var(--border-1)' }}
              >
                {activeClients.map((c) => (
                  <option key={c.clientId} value={c.clientId}>{c.fullName}</option>
                ))}
              </select>
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
  tp,
  planSelector,
  emptyNode,
}: {
  title: string
  subtitle: string
  shouldReduce: boolean
  isLoading: boolean
  isError: boolean
  analytics: import('../types').PlanAnalyticsResponse | undefined
  tp: Record<string, string>
  planSelector?: React.ReactNode
  emptyNode?: React.ReactNode
}) {
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
          {/* Summary cards */}
          <motion.div
            initial={shouldReduce ? false : 'hidden'}
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            <StatCard icon={<Dumbbell size={18} />} label={tp.totalWorkouts} value={String(analytics.totalWorkoutsCompleted)} shouldReduce={shouldReduce} />
            <StatCard icon={<Weight size={18} />}   label={tp.totalVolume}   value={`${(analytics.totalVolume / 1000).toFixed(1)}t`} shouldReduce={shouldReduce} />
            <StatCard icon={<Target size={18} />}   label={tp.consistency}   value={`${analytics.consistencyPercent}%`} shouldReduce={shouldReduce} />
            <StatCard icon={<CalendarDays size={18} />} label={tp.avgSessions} value={String(analytics.avgSessionsPerWeek)} shouldReduce={shouldReduce} />
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

          {/* Muscle Group Distribution */}
          <motion.div {...(shouldReduce ? {} : slideUp)}>
            <Card>
              <h2 className="mb-4 text-base font-semibold text-text">{tp.muscleGroups}</h2>
              {analytics.muscleGroupVolume.length === 0 ? (
                <p className="text-sm text-muted">{tp.noData}</p>
              ) : (
                <div style={{ height: Math.max(160, analytics.muscleGroupVolume.length * 36) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.muscleGroupVolume} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" horizontal={false} />
                      <XAxis type="number" tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="muscleGroup" tick={TICK_STYLE} tickLine={false} axisLine={false} width={80} />
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        labelStyle={{ color: 'var(--fg-1)' }}
                        itemStyle={{ color: 'var(--color-primary)' }}
                        formatter={(value) => [`${Number(value ?? 0)} sets`, 'Sets']}
                      />
                      <Bar dataKey="completedSets" radius={[0, 4, 4, 0]} name="completedSets">
                        {analytics.muscleGroupVolume.map((_, i) => (
                          <Cell key={i} fill="var(--color-primary)" fillOpacity={1 - i * 0.06} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </motion.div>
        </>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn('rounded-xl border px-3 py-2 text-sm font-medium outline-none bg-surface text-text')}
      style={{ borderColor: 'var(--border-1)' }}
    >
      {plans.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}{p.isActive ? ` (${activeLabel})` : ''}
        </option>
      ))}
    </select>
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
