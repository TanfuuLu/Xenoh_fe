import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { ChevronLeft, Sparkles, Activity, TrendingUp, Dumbbell, Target, RefreshCw, Scale, Gauge } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Spinner } from '@/shared/components/Spinner'
import { useT } from '@/shared/i18n'
import { useUserAnalysis } from '../api/useUserAnalysis'
import type { AnalysisSection, AnalysisRecommendation } from '../types'

export function InsightsPage() {
  const t = useT()
  const ti = t.insights
  const { data, isLoading, isFetching, isError, error, refetch } = useUserAnalysis()

  const errorMessage = (() => {
    const e = error as { response?: { data?: { message?: string } }; message?: string } | null | undefined
    return e?.response?.data?.message ?? e?.message ?? ti.errorGeneric
  })()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
        <Link to="/dashboard" className="self-start">
          <Button variant="ghost" size="sm">
            <ChevronLeft size={16} />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles size={22} style={{ color: 'var(--xn-clay-700)' }} className="sm:hidden" />
            <Sparkles size={26} style={{ color: 'var(--xn-clay-700)' }} className="hidden sm:block" />
            <h1 className="text-2xl font-bold text-text sm:text-3xl lg:text-4xl">{ti.title}</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted sm:text-base lg:text-lg">{ti.subtitle}</p>
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
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card animate={false} className="space-y-6 p-5 sm:space-y-8 sm:p-7 lg:space-y-10 lg:p-9">
            {/* Header strip: timestamp */}
            <div
              className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 sm:pb-4"
              style={{ borderColor: 'var(--border-1)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted sm:text-sm">
                {data.cached ? ti.cachedAt : ti.generatedAt}
              </p>
              <p className="text-xs text-muted sm:text-sm">
                {format(new Date(data.generatedAt), 'd MMM yyyy, HH:mm')}
              </p>
            </div>

            {/* Summary section */}
            <div
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              style={{ borderColor: 'var(--border-1)' }}
            >
              <div>
                <SummaryBlock
                  icon={<Activity size={18} className="text-success" />}
                  iconBg="var(--xn-success-bg)"
                  eyebrow={ti.adherenceLabel}
                  section={data.content.trainingAdherence}
                />
              </div>
              <div>
                <SummaryBlock
                  icon={<TrendingUp size={18} className="text-primary" />}
                  iconBg="var(--xn-clay-100)"
                  eyebrow={ti.bodyLabel}
                  section={data.content.bodyMetrics}
                />
              </div>
              <div>
                <SummaryBlock
                  icon={<Dumbbell size={18} className="text-warning" />}
                  iconBg="var(--xn-warning-bg)"
                  eyebrow={ti.volumeLabel}
                  section={data.content.volumeStrength}
                />
              </div>
              <div>
                <SummaryBlock
                  icon={<Scale size={18} style={{ color: 'var(--xn-sage-700)' }} />}
                  iconBg="var(--xn-sage-200)"
                  eyebrow={ti.muscleBalanceLabel ?? 'Muscle balance'}
                  section={data.content.muscleBalance}
                />
              </div>
              <div>
                <SummaryBlock
                  icon={<Gauge size={18} style={{ color: 'var(--xn-clay-700)' }} />}
                  iconBg="var(--xn-clay-100)"
                  eyebrow={ti.effortGapLabel ?? 'Effort gap'}
                  section={data.content.effortGap}
                />
              </div>
            </div>

            {/* Insight / recommendation block */}
            <RecommendationBlock
              eyebrow={ti.recommendationLabel}
              rec={data.content.recommendation}
            />
          </Card>
        </motion.div>
      )}
    </div>
  )
}

// ─── Summary block (one of three columns) ──────────────────────────────────

interface SummaryBlockProps {
  icon: React.ReactNode
  iconBg: string
  eyebrow: string
  section: AnalysisSection
}

function SummaryBlock({ icon, iconBg, eyebrow, section }: SummaryBlockProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted sm:text-sm">
          {eyebrow}
        </p>
      </div>
      <h3 className="text-base font-semibold leading-snug text-text sm:text-lg">
        {section.headline}
      </h3>
      <p className="text-sm leading-relaxed text-muted sm:text-base">{section.detail}</p>
    </div>
  )
}

// ─── Recommendation block (full width, accent-styled) ──────────────────────

interface RecommendationBlockProps {
  eyebrow: string
  rec: AnalysisRecommendation
}

function RecommendationBlock({ eyebrow, rec }: RecommendationBlockProps) {
  return (
    <div
      className="rounded-2xl p-5 sm:p-6 lg:p-7"
      style={{
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent)',
      }}
    >
      <div className="mb-4 flex items-center gap-2.5">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11"
          style={{ background: 'var(--accent)', color: 'var(--fg-on-clay)' }}
        >
          <Target size={18} />
        </div>
        <p
          className="text-xs font-semibold uppercase tracking-wide sm:text-sm"
          style={{ color: 'var(--accent)' }}
        >
          {eyebrow}
        </p>
      </div>
      <h3 className="text-lg font-semibold leading-snug text-text sm:text-xl lg:text-2xl">
        {rec.headline}
      </h3>
      {rec.actions.length > 0 && (
        <ul className="mt-4 space-y-2.5 sm:space-y-3">
          {rec.actions.map((action, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-text sm:text-base lg:text-lg">
              <span
                className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full sm:mt-2.5 sm:h-2 sm:w-2"
                style={{ background: 'var(--accent)' }}
              />
              <span className="leading-relaxed">{action}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
