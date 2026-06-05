import { RefreshCw, Sparkles, Target } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { useLangStore } from '@/shared/i18n'
import type { TrainingCoachTipResponse } from '../types'

interface Props {
  tip?: TrainingCoachTipResponse
  isLoading?: boolean
  isError?: boolean
  isFetching?: boolean
  compact?: boolean
  onRefresh?: () => void
}

const labels = {
  en: {
    eyebrow: 'Xenoh Coach',
    title: 'Training tip',
    subtitle: 'One evidence-backed decision from your recent training data.',
    evidence: 'Evidence',
    why: 'Why it matters',
    next: 'Next action',
    cached: 'Cached',
    fresh: 'Fresh',
    unavailable: 'Xenoh Coach tip is unavailable right now.',
    loading: 'Reading your training signals...',
    refresh: 'Refresh',
  },
  vi: {
    eyebrow: 'Xenoh Coach',
    title: 'Gợi ý tập luyện',
    subtitle: 'Một quyết định thực tế dựa trên dữ liệu tập gần đây của bạn.',
    evidence: 'Bằng chứng',
    why: 'Vì sao quan trọng',
    next: 'Hành động tiếp theo',
    cached: 'Đã cache',
    fresh: 'Mới',
    unavailable: 'Chưa tải được gợi ý Xenoh Coach lúc này.',
    loading: 'Đang đọc tín hiệu tập luyện...',
    refresh: 'Làm mới',
  },
} as const

export function TrainingCoachTipCard({
  tip,
  isLoading,
  isError,
  isFetching,
  compact = false,
  onRefresh,
}: Props) {
  const lang = useLangStore((s) => s.lang)
  const copy = labels[lang]

  if (isLoading) {
    return (
      <Card animate={!compact} className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <Spinner />
        <p className="text-sm text-muted">{copy.loading}</p>
      </Card>
    )
  }

  if (isError || !tip) {
    return (
      <Card animate={!compact} className="space-y-3 py-6 text-center">
        <p className="text-sm font-semibold text-text">{copy.unavailable}</p>
        {onRefresh && (
          <Button size="sm" variant="secondary" onClick={onRefresh} disabled={isFetching}>
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            {copy.refresh}
          </Button>
        )}
      </Card>
    )
  }

  return (
    <Card
      animate={!compact}
      className={compact ? 'space-y-3 p-4' : 'overflow-hidden !p-0'}
      style={{
        borderColor: 'color-mix(in srgb, var(--accent) 22%, var(--border-1))',
        background: compact
          ? 'var(--bg-2)'
          : 'linear-gradient(135deg, color-mix(in srgb, var(--accent-soft) 52%, var(--bg-1)), var(--bg-1))',
      }}
    >
      <div className={compact ? 'space-y-3' : 'space-y-5 p-5 sm:p-6'}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <Sparkles size={19} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{copy.eyebrow}</p>
              <h2 className={compact ? 'text-base font-bold leading-snug text-text' : 'text-xl font-bold leading-snug text-text'}>
                {tip.headline}
              </h2>
              {!compact && <p className="mt-1 text-sm text-muted">{copy.subtitle}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}>
              {tip.category}
            </span>
            <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              {tip.cached ? copy.cached : copy.fresh}
            </span>
          </div>
        </div>

        <div className={compact ? 'space-y-3' : 'grid gap-4 lg:grid-cols-[1.1fr_0.9fr]'}>
          <section className="rounded-lg border p-4" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-1)' }}>
            <p className="text-sm leading-6 text-text">{tip.insight}</p>
            <div className="mt-4 rounded-lg p-3" style={{ background: 'var(--bg-2)' }}>
              <div className="mb-2 flex items-center gap-2">
                <Target size={15} style={{ color: 'var(--accent)' }} />
                <p className="text-sm font-semibold text-text">{copy.next}</p>
              </div>
              <p className="text-sm leading-6 text-muted">{tip.nextAction}</p>
            </div>
          </section>

          <section className="rounded-lg border p-4" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-1)' }}>
            <p className="text-sm font-semibold text-text">{copy.evidence}</p>
            {tip.evidence.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted">
                {tip.evidence.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : (
              <p className="mt-2 text-sm leading-6 text-muted">{tip.whyItMatters}</p>
            )}
            {!compact && (
              <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border-1)' }}>
                <p className="text-sm font-semibold text-text">{copy.why}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{tip.whyItMatters}</p>
              </div>
            )}
          </section>
        </div>

        {onRefresh && !compact && (
          <div className="flex justify-end">
            <Button size="sm" variant="secondary" onClick={onRefresh} disabled={isFetching}>
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              {copy.refresh}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
