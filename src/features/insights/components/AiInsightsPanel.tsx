import { Activity, AlertTriangle, CheckCircle2, Dumbbell, Eye, Gauge, RefreshCw, Scale, Sparkles, Target, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { useT } from '@/shared/i18n'
import { useUserAnalysis } from '../api/useUserAnalysis'
import type { AnalysisContent, AnalysisPlanReview, AnalysisRecommendation, AnalysisSection } from '../types'

type InsightSectionKey = keyof Pick<
  AnalysisContent,
  'trainingAdherence' | 'bodyMetrics' | 'volumeStrength' | 'muscleBalance' | 'effortGap'
>

interface Props {
  title?: string
  sections: InsightSectionKey[]
  compact?: boolean
}

export function AiInsightsPanel({ title, sections, compact = false }: Props) {
  const t = useT()
  const ti = t.insights
  const { data, isLoading, isFetching, isError, refetch } = useUserAnalysis()

  const labels: Record<InsightSectionKey, string> = {
    trainingAdherence: ti.adherenceLabel,
    bodyMetrics: ti.bodyLabel,
    volumeStrength: ti.volumeLabel,
    muscleBalance: ti.muscleBalanceLabel,
    effortGap: ti.effortGapLabel,
  }

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-muted">{ti.generating}</p>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card className="space-y-3 py-8 text-center">
        <p className="font-semibold text-text">{ti.errorTitle}</p>
        <p className="text-sm text-muted">{ti.errorGeneric}</p>
        <Button type="button" size="sm" onClick={() => refetch()}>
          <RefreshCw size={14} />
          {ti.tryAgain}
        </Button>
      </Card>
    )
  }

  const cards = sections.map((key) => ({
    key,
    label: labels[key],
    section: data.content[key],
    visual: getPanelSectionVisual(key),
  }))

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-text">{title ?? ti.aiCoachNotes}</h2>
          <Badge>{data.cached ? ti.cachedBadge : ti.freshBadge}</Badge>
        </div>
        <Button type="button" size="sm" variant="secondary" disabled={isFetching} onClick={() => refetch()}>
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          {ti.refresh}
        </Button>
      </div>

      <RecommendationBlock label={ti.recommendationLabel} rec={data.content.recommendation} />

      {data.content.planReview && (
        <PlanReviewBlock
          label={ti.planReviewLabel}
          suggestionsLabel={ti.suggestionsLabel}
          review={data.content.planReview}
        />
      )}

      <div className={compact ? 'grid gap-3 lg:grid-cols-3' : 'grid gap-3 md:grid-cols-2'}>
        {cards.map(({ key, label, section, visual }) => (
          <AiInsightSummary key={key} label={label} section={section} icon={visual.icon} tone={visual.tone} />
        ))}
      </div>
    </Card>
  )
}

function RecommendationBlock({ label, rec }: { label: string; rec: AnalysisRecommendation }) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        background: 'linear-gradient(135deg, color-mix(in oklch, var(--accent-soft) 76%, var(--bg-2) 24%), var(--bg-2))',
        borderColor: 'var(--surface-border)',
      }}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
        <span className="flex h-8 w-8 items-center justify-center rounded-md border" style={{ background: 'var(--bg-2)', borderColor: 'var(--border-1)' }}>
          <Target size={16} />
        </span>
        {label}
      </div>
      <p className="mt-3 text-lg font-semibold leading-snug text-text">{rec.headline}</p>
      {rec.actions.length > 0 && (
        <ul className="mt-3 grid gap-2 md:grid-cols-3">
          {rec.actions.slice(0, 3).map((action) => (
            <li key={action} className="flex items-start gap-2 rounded-md border p-3 text-sm text-text" style={{ background: 'var(--bg-2)', borderColor: 'var(--border-1)' }}>
              <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
              <span className="leading-relaxed">{action}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PlanReviewBlock({
  label,
  suggestionsLabel,
  review,
}: {
  label: string
  suggestionsLabel: string
  review: AnalysisPlanReview
}) {
  const hasMistakes = review.mistakes.length > 0
  const hasSuggestions = review.suggestions.length > 0

  if (!hasMistakes && !hasSuggestions) return null

  return (
    <div className="rounded-lg border p-4" style={{ background: 'color-mix(in oklch, var(--bg-2) 82%, var(--xn-warning-bg) 18%)', borderColor: 'var(--surface-border)' }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: 'var(--xn-warning-bg)', color: 'var(--xn-warning)' }}>
          <AlertTriangle size={16} />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      </div>
      <p className="mt-2 font-semibold text-text">{review.headline}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {hasMistakes && (
          <div className="rounded-lg border p-3" style={{ background: 'var(--bg-2)', borderColor: 'var(--border-1)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
            <ul className="mt-2 space-y-2">
              {review.mistakes.slice(0, 3).map((mistake) => (
                <li key={mistake} className="flex items-start gap-2 text-sm text-text">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--xn-warning)' }} />
                  <span className="leading-relaxed">{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {hasSuggestions && (
          <div className="rounded-lg border p-3" style={{ background: 'var(--bg-2)', borderColor: 'var(--border-1)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{suggestionsLabel}</p>
            <ul className="mt-2 space-y-2">
              {review.suggestions.slice(0, 3).map((suggestion) => (
                <li key={suggestion} className="flex items-start gap-2 text-sm text-text">
                  <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--xn-success)' }} />
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

function AiInsightSummary({
  label,
  section,
  icon,
  tone,
}: {
  label: string
  section: AnalysisSection
  icon: ReactNode
  tone: InsightTone
}) {
  const tokens = getInsightTone(tone)
  const points = splitInsightDetail(section.detail)

  return (
    <div className="rounded-lg border p-4" style={{ background: tokens.softBg, borderColor: tokens.border }}>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        <span className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: tokens.iconBg, color: tokens.color }}>
          {icon}
        </span>
        <span>{label}</span>
      </div>
      <p className="font-semibold leading-snug text-text">{section.headline}</p>
      <div className="mt-3 space-y-2">
        {points.map((point) => (
          <div key={point} className="flex items-start gap-2 text-sm text-muted">
            <Eye size={14} className="mt-0.5 flex-shrink-0" style={{ color: tokens.color }} />
            <span className="leading-relaxed">{point}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type InsightTone = 'warning' | 'success' | 'info' | 'neutral'

function getPanelSectionVisual(key: InsightSectionKey): { icon: ReactNode; tone: InsightTone } {
  switch (key) {
    case 'trainingAdherence':
      return { icon: <Activity size={16} />, tone: 'warning' }
    case 'bodyMetrics':
      return { icon: <TrendingUp size={16} />, tone: 'warning' }
    case 'volumeStrength':
      return { icon: <Dumbbell size={16} />, tone: 'success' }
    case 'muscleBalance':
      return { icon: <Scale size={16} />, tone: 'info' }
    case 'effortGap':
      return { icon: <Gauge size={16} />, tone: 'neutral' }
  }
}

function getInsightTone(tone: InsightTone) {
  if (tone === 'warning') {
    return {
      color: 'var(--xn-warning)',
      iconBg: 'var(--xn-warning-bg)',
      softBg: 'color-mix(in oklch, var(--bg-2) 78%, var(--xn-warning-bg) 22%)',
      border: 'color-mix(in oklch, var(--xn-warning) 42%, var(--border-1) 58%)',
    }
  }

  if (tone === 'success') {
    return {
      color: 'var(--xn-success)',
      iconBg: 'var(--xn-success-bg)',
      softBg: 'color-mix(in oklch, var(--bg-2) 82%, var(--xn-success-bg) 18%)',
      border: 'color-mix(in oklch, var(--xn-success) 42%, var(--border-1) 58%)',
    }
  }

  if (tone === 'info') {
    return {
      color: 'var(--xn-info)',
      iconBg: 'var(--xn-info-bg)',
      softBg: 'color-mix(in oklch, var(--bg-2) 82%, var(--xn-info-bg) 18%)',
      border: 'color-mix(in oklch, var(--xn-info) 40%, var(--border-1) 60%)',
    }
  }

  return {
    color: 'var(--accent)',
    iconBg: 'var(--accent-soft)',
    softBg: 'var(--bg-2)',
    border: 'var(--border-1)',
  }
}

function splitInsightDetail(detail: string) {
  const points = detail
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean)

  return points.length > 0 ? points.slice(0, 3) : [detail]
}
