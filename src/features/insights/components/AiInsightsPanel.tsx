import { AlertTriangle, CheckCircle2, RefreshCw, Sparkles, Target } from 'lucide-react'
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
        {cards.map(({ key, label, section }) => (
          <AiInsightSummary key={key} label={label} section={section} />
        ))}
      </div>
    </Card>
  )
}

function RecommendationBlock({ label, rec }: { label: string; rec: AnalysisRecommendation }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
        <Target size={15} />
        {label}
      </div>
      <p className="mt-2 font-semibold text-text">{rec.headline}</p>
      {rec.actions.length > 0 && (
        <ul className="mt-3 grid gap-2 md:grid-cols-3">
          {rec.actions.slice(0, 3).map((action) => (
            <li key={action} className="flex items-start gap-2 text-sm text-text">
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
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-2)', borderColor: 'var(--border-1)' }}>
      <div className="flex flex-wrap items-center gap-2">
        <AlertTriangle size={16} style={{ color: 'var(--xn-warning)' }} />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      </div>
      <p className="mt-2 font-semibold text-text">{review.headline}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {hasMistakes && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
            <ul className="mt-2 space-y-2">
              {review.mistakes.slice(0, 3).map((mistake) => (
                <li key={mistake} className="flex items-start gap-2 text-sm text-text">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: 'var(--xn-warning)' }} />
                  <span className="leading-relaxed">{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {hasSuggestions && (
          <div>
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

function AiInsightSummary({ label, section }: { label: string; section: AnalysisSection }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-semibold text-text">{section.headline}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{section.detail}</p>
    </div>
  )
}
