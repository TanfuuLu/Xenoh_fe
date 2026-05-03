import { useState } from 'react'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/utils/cn'
import { Button } from '@/shared/components/Button'
import { useSubscription } from '../api/useSubscription'
import { TIER_LABELS, TIER_PRICES } from '../types'
import type { PlanTier } from '../types'

interface Props {
  onSelect: (tier: Exclude<PlanTier, 'Free'>, durationMonths: 1 | 3 | 12) => void
  loading?: boolean
}

type Duration = 1 | 3 | 12

const durations: Duration[] = [1, 3, 12]
const durationLabels: Record<Duration, string> = { 1: '1 month', 3: '3 months', 12: '12 months' }

const freeFeatures = [
  'Max 3 training plans',
  'Max 5 coach clients',
  'Basic workout logging',
  'Progress tracking & charts',
  'Bulk messaging',
]

const proIndividualExtras = [
  'Unlimited training plans',
  'Advanced analytics',
]

const proCoachExtras = [
  'Unlimited coach clients',
  'Coach plan creation tools',
]

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export function PricingTable({ onSelect, loading }: Props) {
  const [duration, setDuration] = useState<Duration>(1)
  const { data: subscription } = useSubscription()
  const currentTier = subscription?.tier ?? 'Free'

  const isCurrentPlan = (tier: PlanTier) => currentTier === tier

  return (
    <div className="flex flex-col gap-6">
      {/* Duration toggle */}
      <div className="flex items-center gap-2 self-center rounded-xl p-1" style={{ background: 'var(--bg-2)' }}>
        {durations.map((d) => (
          <button
            key={d}
            onClick={() => setDuration(d)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              duration === d
                ? 'text-white shadow-sm'
                : 'text-[var(--fg-3)] hover:text-[var(--fg-1)]',
            )}
            style={duration === d ? { background: 'var(--color-primary)' } : { background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {durationLabels[d]}
          </button>
        ))}
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-3">

        {/* Free */}
        <div
          className="flex flex-col gap-4 rounded-2xl p-6"
          style={{ border: '1px solid var(--border-1)', background: 'var(--bg-2)' }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--fg-3)' }}>
              {TIER_LABELS.Free}
            </p>
            <p className="mt-1 text-3xl font-bold" style={{ color: 'var(--fg-1)' }}>
              {formatVnd(0)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--fg-3)' }}>Forever free</p>
          </div>
          <FeatureList heading={null} items={freeFeatures} />
          <Button variant="secondary" disabled className="mt-auto">
            {isCurrentPlan('Free') ? 'Current Plan' : 'Free Plan'}
          </Button>
        </div>

        {/* Pro Individual */}
        <motion.div
          initial={{ scale: 1 }}
          whileHover={isCurrentPlan('ProIndividual') ? {} : { scale: 1.02 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col gap-4 rounded-2xl p-6 relative"
          style={{
            border: isCurrentPlan('ProIndividual')
              ? '2px solid #22c55e'
              : '2px solid var(--color-primary)',
            background: 'var(--bg-2)',
          }}
        >
          {/* Top badge */}
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-bold text-white"
            style={{ background: isCurrentPlan('ProIndividual') ? '#22c55e' : 'var(--color-primary)' }}
          >
            {isCurrentPlan('ProIndividual') ? 'Current Plan' : 'Popular'}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: isCurrentPlan('ProIndividual') ? '#22c55e' : 'var(--color-primary)' }}>
              {TIER_LABELS.ProIndividual}
            </p>
            <p className="mt-1 text-3xl font-bold" style={{ color: 'var(--fg-1)' }}>
              {formatVnd(TIER_PRICES.ProIndividual[duration])}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--fg-3)' }}>/{durationLabels[duration]}</p>
          </div>

          <FeatureList heading="Everything in Free and:" items={proIndividualExtras} />

          {isCurrentPlan('ProIndividual') ? (
            <Button disabled className="mt-auto !bg-green-500 hover:!bg-green-500 cursor-default">
              ✓ Your Current Plan
            </Button>
          ) : (
            <Button onClick={() => onSelect('ProIndividual', duration)} loading={loading} className="mt-auto">
              Upgrade to Pro Individual
            </Button>
          )}
        </motion.div>

        {/* Pro Coach */}
        <motion.div
          initial={{ scale: 1 }}
          whileHover={isCurrentPlan('ProCoach') ? {} : { scale: 1.02 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col gap-4 rounded-2xl p-6 relative"
          style={{
            border: isCurrentPlan('ProCoach') ? '2px solid #22c55e' : '1px solid #f59e0b',
            background: 'var(--bg-2)',
          }}
        >
          {isCurrentPlan('ProCoach') && (
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-bold text-white"
              style={{ background: '#22c55e' }}
            >
              Current Plan
            </div>
          )}

          <div>
            <p className={cn('text-xs font-semibold uppercase tracking-widest', isCurrentPlan('ProCoach') ? 'text-green-500' : 'text-amber-500')}>
              {TIER_LABELS.ProCoach}
            </p>
            <p className="mt-1 text-3xl font-bold" style={{ color: 'var(--fg-1)' }}>
              {formatVnd(TIER_PRICES.ProCoach[duration])}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--fg-3)' }}>/{durationLabels[duration]}</p>
          </div>

          <FeatureList heading="Everything in Pro Individual, plus:" items={proCoachExtras} />

          {isCurrentPlan('ProCoach') ? (
            <Button disabled className="mt-auto !bg-green-500 hover:!bg-green-500 cursor-default">
              ✓ Your Current Plan
            </Button>
          ) : (
            <Button
              onClick={() => onSelect('ProCoach', duration)}
              loading={loading}
              className="mt-auto !bg-amber-500 hover:!bg-amber-400"
            >
              Upgrade to Pro Coach
            </Button>
          )}
        </motion.div>

      </div>
    </div>
  )
}

function FeatureList({ heading, items }: { heading: string | null; items: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      {heading && (
        <p className="text-sm font-semibold" style={{ color: 'var(--fg-2)' }}>{heading}</p>
      )}
      <ul className="flex flex-col gap-2">
        {items.map((label) => (
          <li key={label} className="flex items-center gap-2 text-sm">
            <Check size={14} className="shrink-0 text-green-500" />
            <span style={{ color: 'var(--fg-1)' }}>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
