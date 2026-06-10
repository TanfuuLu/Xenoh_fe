import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Dumbbell, Sparkles, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Select } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
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
import type { PlanAnalyticsResponse, PowerliftingSection } from '../types'
import { OverviewSection } from '../components/OverviewSection'
import { PowerliftingAiFocusPanel } from '../components/PowerliftingAiFocusPanel'
import { PlanProgressInsightPanel } from '../components/PlanProgressInsightPanel'
import { ProgressTabs, PlanSelect, type ProgressTab } from '../components/ProgressControls'

type ProgressInsightMode = 'overview' | 'powerlifting'

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
      planId={selectedPlanId || null}
      planInsightEnabled
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
  planId = null,
  planInsightEnabled = false,
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
  planId?: string | null
  planInsightEnabled?: boolean
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
          ) : planInsightEnabled && planId ? (
            <PlanProgressInsightPanel planId={planId} tp={tp} />
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
