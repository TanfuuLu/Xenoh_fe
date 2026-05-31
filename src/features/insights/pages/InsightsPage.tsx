import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import type { ReactElement, ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  ChevronLeft,
  Dumbbell,
  Gauge,
  RefreshCw,
  Scale,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
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
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { RequireTier } from '@/features/billing/components/RequireTier'
import { useT } from '@/shared/i18n'
import { useUserAnalysis } from '../api/useUserAnalysis'
import type {
  AnalysisContent,
  AnalysisEffortGapPoint,
  AnalysisMetrics,
  AnalysisPlanReview,
  AnalysisRecommendation,
  AnalysisSection,
} from '../types'

const TICK_STYLE = { fill: 'var(--fg-3)', fontSize: 11 }
const TOOLTIP_STYLE = {
  background: 'var(--bg-2)',
  border: '1px solid var(--border-1)',
  borderRadius: 8,
  color: 'var(--fg-1)',
  fontSize: 12,
}
const MUSCLE_COLORS = ['#876f5e', '#72785a', '#8d560d', '#485a66', '#802013', '#998270']

export function InsightsPage() {
  const t = useT()
  const ti = t.insights
  const { data, isLoading, isFetching, isError, error, refetch } = useUserAnalysis()

  const errorMessage = (() => {
    const e = error as { response?: { data?: { message?: string } }; message?: string } | null | undefined
    return e?.response?.data?.message ?? e?.message ?? ti.errorGeneric
  })()

  return (
    <RequireTier feature="Analyze">
      <div className="mx-auto w-full max-w-[1320px] space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <Link to="/dashboard" className="self-start">
            <Button variant="ghost" size="sm" aria-label="Back to dashboard">
              <ChevronLeft size={16} />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles size={24} style={{ color: 'var(--accent)' }} />
              <h1 className="text-2xl font-bold text-text sm:text-3xl">{ti.title}</h1>
            </div>
            <p className="mt-1 text-sm text-muted sm:text-base">{ti.subtitle}</p>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
            {ti.refresh}
          </Button>
        </div>

        {isLoading && (
          <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Spinner size="lg" />
            <p className="text-sm text-muted">{ti.generating}</p>
          </Card>
        )}

        {isError && !isLoading && (
          <Card className="space-y-2 py-6 text-center">
            <p className="text-sm font-semibold text-text">{ti.errorTitle}</p>
            <p className="text-xs text-muted">{errorMessage}</p>
            <Button size="sm" variant="primary" onClick={() => refetch()} className="mt-3 gap-1.5">
              <RefreshCw size={14} />
              {ti.tryAgain}
            </Button>
          </Card>
        )}

        {data && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <div className="space-y-5">
              <OverviewStrip
                generatedAt={data.generatedAt}
                cached={data.cached}
                metrics={data.metrics}
                labels={ti}
              />

              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <BodyweightTrend metrics={data.metrics} labels={ti} />
                <AdherenceVolumeChart metrics={data.metrics} labels={ti} />
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <MuscleBalanceChart metrics={data.metrics} labels={ti} />
                <EffortGapPanel metrics={data.metrics} labels={ti} />
              </div>

              <div className="grid gap-4">
                <RecentPrPanel metrics={data.metrics} labels={ti} />
                <AiNarrativePanel content={data.content} labels={ti} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </RequireTier>
  )
}

function OverviewStrip({
  generatedAt,
  cached,
  metrics,
  labels,
}: {
  generatedAt: string
  cached: boolean
  metrics: AnalysisMetrics
  labels: ReturnType<typeof useT>['insights']
}) {
  const latestWeight = metrics.bodyweight.latestWeight == null
    ? '—'
    : `${formatNumber(metrics.bodyweight.latestWeight)} kg`
  const bodyDelta = metrics.bodyweight.delta == null
    ? labels.noTrend
    : `${metrics.bodyweight.delta > 0 ? '+' : ''}${formatNumber(metrics.bodyweight.delta)} kg`

  return (
    <Card animate={false} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase text-muted">{cached ? labels.cachedAt : labels.generatedAt}</p>
          <p className="text-sm font-medium text-text">{format(new Date(generatedAt), 'd MMM yyyy, HH:mm')}</p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          {cached ? labels.cachedBadge : labels.freshBadge}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={<Activity size={17} />} label={labels.planCompletion} value={`${metrics.adherence.planCompletionPercent}%`} />
        <MetricTile icon={<BarChart3 size={17} />} label={labels.recentVolume} value={formatKg(metrics.volume.recentTotalVolume)} sub={labels.kgReps} />
        <MetricTile icon={<Dumbbell size={17} />} label={labels.totalSets} value={metrics.volume.recentSetCount} />
        <MetricTile icon={<Scale size={17} />} label={labels.bodyTrend} value={latestWeight} sub={bodyDelta} />
      </div>
    </Card>
  )
}

function MetricTile({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg border p-3" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="break-words text-lg font-bold text-text">{value}</p>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
    </div>
  )
}

function BodyweightTrend({ metrics, labels }: { metrics: AnalysisMetrics; labels: ReturnType<typeof useT>['insights'] }) {
  const points = metrics.bodyweight.points.map((p) => ({
    ...p,
    label: format(new Date(p.date), 'd MMM'),
  }))

  return (
    <ChartShell icon={<TrendingUp size={17} />} title={labels.bodyweightChart} empty={!points.length} emptyText={labels.noBodyweightData}>
      <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
        <XAxis dataKey="label" tick={TICK_STYLE} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} width={44} domain={['auto', 'auto']} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${formatNumber(Number(value))} kg`, labels.weight]} />
        <Line type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ChartShell>
  )
}

function AdherenceVolumeChart({ metrics, labels }: { metrics: AnalysisMetrics; labels: ReturnType<typeof useT>['insights'] }) {
  const data = [
    {
      label: labels.previousWeek,
      adherence: metrics.adherence.previousWeek?.completionPercent ?? 0,
      volume: metrics.volume.previousWeekVolume,
    },
    {
      label: labels.currentWeek,
      adherence: metrics.adherence.currentWeek?.completionPercent ?? 0,
      volume: metrics.volume.currentWeekVolume,
    },
  ]

  return (
    <ChartShell icon={<Activity size={17} />} title={labels.weekCompareChart} empty={!metrics.adherence.currentWeek && !metrics.adherence.previousWeek} emptyText={labels.noPlanData}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
        <XAxis dataKey="label" tick={TICK_STYLE} tickLine={false} axisLine={false} />
        <YAxis yAxisId="left" tick={TICK_STYLE} tickLine={false} axisLine={false} width={38} />
        <YAxis yAxisId="right" orientation="right" tick={TICK_STYLE} tickLine={false} axisLine={false} width={72} tickFormatter={(value: number) => formatKg(value)} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value, name) => name === 'volume'
            ? [formatKg(Number(value)), labels.volumeLabel]
            : [`${Number(value)}%`, labels.adherenceLabel]}
        />
        <Bar yAxisId="left" dataKey="adherence" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={34} />
        <Bar yAxisId="right" dataKey="volume" fill="var(--accent-2)" radius={[4, 4, 0, 0]} maxBarSize={34} />
      </BarChart>
    </ChartShell>
  )
}

function MuscleBalanceChart({ metrics, labels }: { metrics: AnalysisMetrics; labels: ReturnType<typeof useT>['insights'] }) {
  return (
    <Card animate={false} className="space-y-4">
      <PanelTitle icon={<Scale size={17} />} title={labels.muscleChart} />
      {metrics.muscleBalance.length === 0 ? (
        <EmptyState text={labels.noMuscleData} />
      ) : (
        <div className="space-y-3">
          {metrics.muscleBalance.slice(0, 6).map((item, index) => (
            <div key={item.muscle} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate font-semibold text-text">{item.muscle}</span>
                <span className="text-muted">{item.sharePercent}% · {formatKg(item.volume)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg-3)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.sharePercent}%`, background: MUSCLE_COLORS[index % MUSCLE_COLORS.length] }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function EffortGapPanel({ metrics, labels }: { metrics: AnalysisMetrics; labels: ReturnType<typeof useT>['insights'] }) {
  const points = [
    ...metrics.effortGap.highRpeMisses.map((p) => ({ ...p, kind: labels.highRpeMiss })),
    ...metrics.effortGap.lowRpeWins.map((p) => ({ ...p, kind: labels.lowRpeWin })),
  ]

  return (
    <Card animate={false} className="space-y-4">
      <PanelTitle icon={<Gauge size={17} />} title={labels.effortChart} />
      {points.length === 0 ? (
        <EmptyState text={labels.noEffortData} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <EffortList title={labels.highRpeMiss} points={metrics.effortGap.highRpeMisses} tone="warning" />
          <EffortList title={labels.lowRpeWin} points={metrics.effortGap.lowRpeWins} tone="success" />
        </div>
      )}
    </Card>
  )
}

function EffortList({ title, points, tone }: { title: string; points: AnalysisEffortGapPoint[]; tone: 'warning' | 'success' }) {
  const color = tone === 'warning' ? 'var(--xn-warning)' : 'var(--xn-success)'
  return (
    <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
      <p className="text-sm font-semibold text-text">{title}</p>
      {points.length === 0 ? (
        <p className="text-xs text-muted">—</p>
      ) : points.map((point) => (
        <div key={`${point.pattern}-${point.exercise}`} className="flex items-start justify-between gap-3 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{point.exercise}</p>
            <p className="text-xs text-muted">{point.sets} sets · RPE {formatNumber(point.averageRpe)}</p>
          </div>
          <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: color }} />
        </div>
      ))}
    </div>
  )
}

function RecentPrPanel({ metrics, labels }: { metrics: AnalysisMetrics; labels: ReturnType<typeof useT>['insights'] }) {
  return (
    <Card animate={false} className="space-y-4">
      <PanelTitle icon={<Award size={17} />} title={labels.prPanel} />
      {metrics.recentPrs.length === 0 ? (
        <EmptyState text={labels.noPrData} />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {metrics.recentPrs.map((pr) => (
            <div key={`${pr.exercise}-${pr.achievedAt}`} className="min-w-[220px] rounded-lg border p-3" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-words text-sm font-semibold text-text">{pr.exercise}</p>
                <p className="flex-shrink-0 text-sm font-bold text-text">{formatNumber(pr.weight)} kg × {pr.reps}</p>
              </div>
              <p className="mt-1 text-xs text-muted">{format(new Date(pr.achievedAt), 'd MMM yyyy')}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function AiNarrativePanel({ content, labels }: { content: AnalysisContent; labels: ReturnType<typeof useT>['insights'] }) {
  const sections: Array<{ label: string; icon: ReactNode; section: AnalysisSection }> = [
    { label: labels.adherenceLabel, icon: <Activity size={16} />, section: content.trainingAdherence },
    { label: labels.bodyLabel, icon: <TrendingUp size={16} />, section: content.bodyMetrics },
    { label: labels.volumeLabel, icon: <Dumbbell size={16} />, section: content.volumeStrength },
    { label: labels.muscleBalanceLabel, icon: <Scale size={16} />, section: content.muscleBalance },
    { label: labels.effortGapLabel, icon: <Gauge size={16} />, section: content.effortGap },
  ]
  const primarySections = sections.slice(0, 2)
  const supportingSections = sections.slice(2)

  return (
    <Card animate={false} className="min-w-0 space-y-5 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <PanelTitle icon={<Sparkles size={17} />} title={labels.aiCoachNotes} />
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {labels.aiCoachNotesSubtitle}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          {labels.coachReviewBadge}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <RecommendationBlock eyebrow={labels.recommendationLabel} rec={content.recommendation} />

        <div className="grid gap-3 sm:grid-cols-2">
          {primarySections.map((item) => (
            <SummaryBlock key={item.label} label={item.label} icon={item.icon} section={item.section} emphasis />
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {supportingSections.map((item) => (
          <SummaryBlock key={item.label} label={item.label} icon={item.icon} section={item.section} />
        ))}
      </div>

      {content.planReview && (
        <PlanReviewBlock
          eyebrow={labels.planReviewLabel}
          suggestionsLabel={labels.suggestionsLabel}
          review={content.planReview}
        />
      )}
    </Card>
  )
}

function SummaryBlock({
  label,
  icon,
  section,
  emphasis = false,
}: {
  label: string
  icon: ReactNode
  section: AnalysisSection
  emphasis?: boolean
}) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        borderColor: emphasis ? 'var(--surface-border)' : 'var(--border-1)',
        background: emphasis ? 'color-mix(in oklch, var(--bg-2) 78%, var(--accent-soft) 22%)' : 'var(--bg-2)',
      }}
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-muted">
        <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          {icon}
        </span>
        <span>{label}</span>
      </div>
      <h3 className="text-base font-semibold leading-snug text-text">{section.headline}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{section.detail}</p>
    </div>
  )
}

function RecommendationBlock({ eyebrow, rec }: { eyebrow: string; rec: AnalysisRecommendation }) {
  return (
    <div
      className="rounded-lg border p-5"
      style={{
        background: 'linear-gradient(180deg, color-mix(in oklch, var(--accent-soft) 76%, var(--bg-2) 24%), var(--accent-soft))',
        borderColor: 'var(--accent)',
      }}
    >
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase" style={{ color: 'var(--accent)' }}>
        <span className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: 'var(--bg-2)' }}>
          <Target size={17} />
        </span>
        <span>{eyebrow}</span>
      </div>
      <h3 className="text-lg font-semibold leading-snug text-text">{rec.headline}</h3>
      {rec.actions.length > 0 && (
        <ul className="mt-3 space-y-2">
          {rec.actions.map((action, index) => (
            <li key={action} className="flex items-start gap-2 text-sm text-text">
              <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: 'var(--bg-2)', color: 'var(--accent)' }}>
                {index + 1}
              </span>
              <span className="leading-relaxed">{action}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PlanReviewBlock({
  eyebrow,
  suggestionsLabel,
  review,
}: {
  eyebrow: string
  suggestionsLabel: string
  review: AnalysisPlanReview
}) {
  const hasMistakes = review.mistakes.length > 0
  const hasSuggestions = review.suggestions.length > 0

  if (!hasMistakes && !hasSuggestions) return null

  return (
    <div className="rounded-lg border p-5" style={{ background: 'var(--bg-2)', borderColor: 'var(--border-1)' }}>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-muted">
        <span className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: 'var(--xn-warning-bg)', color: 'var(--xn-warning)' }}>
          <AlertTriangle size={17} />
        </span>
        <span>{eyebrow}</span>
      </div>
      <h3 className="text-base font-semibold leading-snug text-text">{review.headline}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {hasMistakes && (
          <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-1)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{eyebrow}</p>
            <ul className="mt-2 space-y-2">
              {review.mistakes.map((mistake) => (
                <li key={mistake} className="flex items-start gap-2 text-sm text-text">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: 'var(--xn-warning)' }} />
                  <span className="leading-relaxed">{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {hasSuggestions && (
          <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-1)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{suggestionsLabel}</p>
            <ul className="mt-2 space-y-2">
              {review.suggestions.map((suggestion) => (
                <li key={suggestion} className="flex items-start gap-2 text-sm text-text">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: 'var(--xn-success)' }} />
                  <span className="leading-relaxed">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function ChartShell({
  icon,
  title,
  empty,
  emptyText,
  children,
}: {
  icon: ReactNode
  title: string
  empty: boolean
  emptyText: string
  children: ReactElement
}) {
  return (
    <Card animate={false} className="space-y-4">
      <PanelTitle icon={icon} title={title} />
      {empty ? (
        <EmptyState text={emptyText} />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

function PanelTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-text">
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      <span className="min-w-0 break-words">{title}</span>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-10 text-center text-sm text-muted">{text}</p>
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)
}

function formatKg(value: number) {
  return `${Math.round(value).toLocaleString()} kg`
}
