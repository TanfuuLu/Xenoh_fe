import { Link, Navigate } from 'react-router'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import type { ReactNode } from 'react'
import {
  ChevronLeft,
  Sparkles,
  RefreshCw,
  Dumbbell,
  Apple,
  Repeat,
  Activity,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { RequireTier } from '@/features/billing/components/RequireTier'
import { useMyProfile } from '@/features/profile'
import { useT } from '@/shared/i18n'
import { useCycleInsight } from '../api/useCycle'
import { phaseColor } from '../components/cycleColors'
import type { CyclePhase } from '../types'

export function CycleInsightPage() {
  const { data: profile, isLoading: profileLoading } = useMyProfile()

  if (profileLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }
  if (profile && profile.gender !== 'Female') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <RequireTier feature="Analyze">
      <CycleInsightContent />
    </RequireTier>
  )
}

function CycleInsightContent() {
  const t = useT()
  const ti = t.cycle.insight
  const tc = t.cycle
  const { data, isLoading, isFetching, isError, error, refetch } = useCycleInsight()

  const errorMessage = (() => {
    const e = error as
      | { response?: { status?: number; data?: { message?: string } }; message?: string }
      | null
      | undefined
    if (e?.response?.status === 429) return ti.errorRateLimited
    return e?.response?.data?.message ?? ti.errorGeneric
  })()

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Link to="/cycle" className="self-start">
          <Button variant="ghost" size="sm" aria-label="Back to cycle">
            <ChevronLeft size={16} />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles size={22} style={{ color: '#f43f5e' }} />
            <h1 className="text-2xl font-bold text-text sm:text-3xl">{ti.title}</h1>
          </div>
          <p className="mt-1 text-sm text-muted">{ti.subtitle}</p>
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={() => void refetch()}
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
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          {/* Header strip */}
          <Card animate={false} className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase text-muted">{ti.generatedAt}</p>
              <p className="text-sm font-medium text-text">
                {format(new Date(data.generatedAt), 'd MMM yyyy, HH:mm')}
              </p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: 'color-mix(in srgb, #f43f5e 14%, transparent)', color: '#f43f5e' }}
            >
              {data.cached ? ti.cachedBadge : ti.freshBadge}
            </span>
          </Card>

          {/* Summary */}
          <Card animate={false} className="space-y-2">
            <SectionTitle icon={<Sparkles size={16} />} title={ti.summary} />
            <p className="text-sm leading-relaxed text-text">{data.content.summary}</p>
          </Card>

          {/* Phase recommendations */}
          {data.content.phaseRecommendations.length > 0 && (
            <Card animate={false} className="space-y-4">
              <SectionTitle icon={<Activity size={16} />} title={ti.phaseRecommendations} />
              <div className="grid gap-3 sm:grid-cols-2">
                {data.content.phaseRecommendations.map((rec) => {
                  const color = phaseColor((rec.phase as CyclePhase) ?? 'Unknown')
                  return (
                    <div
                      key={rec.phase}
                      className="rounded-lg border p-4"
                      style={{ borderColor: `color-mix(in srgb, ${color} 32%, var(--border-1))`, background: 'var(--bg-2)' }}
                    >
                      <p className="mb-2 text-sm font-bold" style={{ color }}>
                        {tc.phases[(rec.phase as CyclePhase)] ?? rec.phase}
                      </p>
                      <div className="space-y-2">
                        <TipRow icon={<Dumbbell size={13} />} label={ti.training} text={rec.training} />
                        <TipRow icon={<Apple size={13} />} label={ti.nutrition} text={rec.nutrition} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <ListCard icon={<Repeat size={16} />} title={ti.cyclePatterns} items={data.content.cyclePatterns} />
            <ListCard icon={<Activity size={16} />} title={ti.symptomPatterns} items={data.content.symptomPatterns} />
          </div>

          <ListCard
            icon={<Dumbbell size={16} />}
            title={ti.trainingCorrelations}
            items={data.content.trainingCorrelations}
          />

          {data.content.cautions.length > 0 && (
            <Card
              animate={false}
              className="space-y-3"
              style={{ background: 'color-mix(in oklch, var(--bg-2) 82%, var(--xn-warning-bg) 18%)' }}
            >
              <SectionTitle icon={<AlertTriangle size={16} />} title={ti.cautions} color="var(--xn-warning)" />
              <ul className="space-y-2">
                {data.content.cautions.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-text">
                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--xn-warning)' }} />
                    <span className="leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Disclaimer */}
          <div
            className="flex items-start gap-2 rounded-lg border p-4 text-xs text-text"
            style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}
          >
            <Info size={14} className="mt-0.5 flex-shrink-0 text-muted" />
            <span className="leading-relaxed">{data.content.disclaimer}</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function SectionTitle({ icon, title, color }: { icon: ReactNode; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-text">
      <span style={{ color: color ?? '#f43f5e' }}>{icon}</span>
      {title}
    </div>
  )
}

function TipRow({ icon, label, text }: { icon: ReactNode; label: string; text: string }) {
  return (
    <div className="text-sm">
      <span className="mr-1.5 inline-flex items-center gap-1 text-xs font-semibold uppercase text-muted">
        {icon} {label}
      </span>
      <span className="text-text">{text}</span>
    </div>
  )
}

function ListCard({ icon, title, items }: { icon: ReactNode; title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <Card animate={false} className="space-y-3">
      <SectionTitle icon={icon} title={title} />
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-text">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: '#f43f5e' }} />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
