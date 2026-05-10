import { Link, useParams } from 'react-router'
import { ChevronLeft, RefreshCw, Sparkles } from 'lucide-react'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { useCoachClientAiBrief } from '@/features/coach-client'
import type { CoachClientAiBriefResponse } from '@/features/coach-client'
import { useClientProfile } from '../index'

export function ClientAiInsightPage() {
  const { clientId = '' } = useParams()
  const { data: profile, isLoading: profileLoading } = useClientProfile(clientId)
  const {
    data: insight,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useCoachClientAiBrief(clientId, !!clientId)

  const clientName = profile ? `${profile.firstName} ${profile.lastName}` : 'Client'

  if (profileLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <Link to={`/coach/clients/${clientId}`}>
            <Button variant="ghost" size="sm"><ChevronLeft size={16} /></Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles size={22} style={{ color: 'var(--xn-clay-700)' }} />
              <h1 className="break-words text-2xl font-bold text-text">AI Insight</h1>
            </div>
            <p className="truncate text-sm text-muted">{clientName}</p>
          </div>
        </div>
        <Button type="button" size="sm" variant="secondary" disabled={isFetching} onClick={() => refetch()}>
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {isLoading && (
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Spinner size="lg" />
          <p className="text-sm text-muted">Analyzing client progression...</p>
        </Card>
      )}

      {isError && !isLoading && (
        <Card className="py-8 text-center">
          <p className="text-sm font-semibold text-text">AI insight is unavailable right now.</p>
          <Button type="button" size="sm" className="mt-3" onClick={() => refetch()}>
            <RefreshCw size={14} />
            Try again
          </Button>
        </Card>
      )}

      {insight && !isLoading && <AiInsightContent insight={insight} />}
    </div>
  )
}

function AiInsightContent({ insight }: { insight: CoachClientAiBriefResponse }) {
  const variant =
    insight.attentionLevel === 'High' ? 'danger' :
    insight.attentionLevel === 'Medium' ? 'warning' :
    insight.attentionLevel === 'Low' ? 'primary' :
    'success'

  return (
    <div className="space-y-5">
      <Card animate={false} className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={variant}>{insight.attentionLevel}</Badge>
          {insight.cached && <Badge>Cached</Badge>}
        </div>
        <div>
          <h2 className="text-xl font-bold leading-snug text-text">{insight.headline}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-muted">
            {toSummaryBullets(insight.progressSummary).map((item, index) => (
              <li key={`summary-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <InsightList title="Risks" items={insight.risks} />
        <InsightList title="Opportunities" items={insight.opportunities} />
      </div>
    </div>
  )
}

function toSummaryBullets(summary: string) {
  return summary
    .split(/(?<=[.!?。！？])\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <Card animate={false} className="p-5">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{title}</p>
      {items.length > 0 ? (
        <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-text">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No notable items.</p>
      )}
    </Card>
  )
}
