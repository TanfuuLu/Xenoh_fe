import { useState } from 'react'
import { Check, Lock } from 'lucide-react'
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

const savingsPercent: Record<Duration, number | null> = {
  1: null,
  3: Math.round((1 - TIER_PRICES.ProIndividual[3] / (3 * TIER_PRICES.ProIndividual[1])) * 100),
  12: Math.round((1 - TIER_PRICES.ProIndividual[12] / (12 * TIER_PRICES.ProIndividual[1])) * 100),
}

const freeFeatures = [
  'Max 3 training plans',
  'Max 5 coach clients',
  'Basic workout logging',
  'Progress tracking & charts',
  'Bulk messaging',
]

const lockedOnFree = [
  'Unlimited training plans',
  'Advanced analytics',
  'Unlimited coach clients',
  'Coach plan creation tools',
]

const proIndividualFeatures = [
  'Everything in Free',
  'Unlimited training plans',
  'Advanced analytics',
]

const proCoachFeatures = [
  'Everything in Pro Individual',
  'Unlimited coach clients',
  'Coach plan creation tools',
]

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function perMonthPrice(total: number, months: number) {
  return Math.round(total / months)
}

export function PricingTable({ onSelect, loading }: Props) {
  const [duration, setDuration] = useState<Duration>(1)
  const { data: subscription } = useSubscription()
  const currentTier = subscription?.tier ?? 'Free'

  const isCurrentPlan = (tier: PlanTier) => currentTier === tier

  return (
    <div className="flex flex-col gap-6">
      {/* Duration toggle */}
      <div className="flex items-center gap-1 self-center rounded-xl p-1" style={{ background: 'var(--bg-3)' }}>
        {durations.map((d) => {
          const savings = savingsPercent[d]
          const isActive = duration === d
          return (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
                !isActive && 'hover:text-[var(--fg-1)]',
              )}
              style={
                isActive
                  ? { background: 'var(--accent)', border: 'none', cursor: 'pointer', color: 'var(--fg-on-clay)' }
                  : { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)' }
              }
            >
              {durationLabels[d]}
              {savings !== null && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
                  style={
                    isActive
                      ? { background: 'rgba(255,255,255,0.25)', color: 'var(--fg-on-clay)' }
                      : { background: 'var(--xn-sage-200)', color: 'var(--color-success)' }
                  }
                >
                  -{savings}%
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-3">

        {/* Free */}
        <div
          className="relative flex flex-col gap-4 rounded-2xl p-6"
          style={{
            border: isCurrentPlan('Free') ? '2px solid var(--xn-sage-500)' : '1px solid var(--border-1)',
            background: 'var(--bg-2)',
          }}
        >
          {isCurrentPlan('Free') && (
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-bold whitespace-nowrap"
              style={{ background: 'var(--xn-sage-500)', color: '#fff' }}
            >
              Current Plan
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--fg-3)' }}>
              {TIER_LABELS.Free}
            </p>
            <p className="mt-1 text-3xl font-bold" style={{ color: 'var(--fg-1)' }}>
              {formatVnd(0)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--fg-3)' }}>Forever free</p>
          </div>

          <ul className="flex flex-col gap-2">
            {freeFeatures.map((label) => (
              <li key={label} className="flex items-center gap-2 text-sm">
                <Check size={14} className="shrink-0" style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--fg-2)' }}>{label}</span>
              </li>
            ))}
            {lockedOnFree.map((label) => (
              <li key={label} className="flex items-center gap-2 text-sm opacity-40">
                <Lock size={13} className="shrink-0" style={{ color: 'var(--fg-3)' }} />
                <span style={{ color: 'var(--fg-3)' }}>{label}</span>
              </li>
            ))}
          </ul>

          <Button variant="secondary" disabled className="mt-auto">
            {isCurrentPlan('Free') ? 'Current Plan' : 'Free Plan'}
          </Button>
        </div>

        {/* Pro Individual */}
        <motion.div
          initial={{ scale: 1 }}
          whileHover={isCurrentPlan('ProIndividual') ? {} : { scale: 1.02 }}
          transition={{ duration: 0.15 }}
          className="relative flex flex-col gap-4 rounded-2xl p-6"
          style={{
            border: isCurrentPlan('ProIndividual')
              ? '2px solid var(--xn-sage-500)'
              : '2px solid var(--accent)',
            background: 'var(--bg-2)',
          }}
        >
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-bold whitespace-nowrap"
            style={{ background: isCurrentPlan('ProIndividual') ? 'var(--xn-sage-500)' : 'var(--accent)', color: '#fff' }}
          >
            {isCurrentPlan('ProIndividual') ? 'Current Plan' : 'Most Popular'}
          </div>

          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: isCurrentPlan('ProIndividual') ? 'var(--color-success)' : 'var(--accent)' }}
            >
              {TIER_LABELS.ProIndividual}
            </p>
            <p className="mt-1 text-3xl font-bold" style={{ color: 'var(--fg-1)' }}>
              {formatVnd(TIER_PRICES.ProIndividual[duration])}
            </p>
            {duration === 1 ? (
              <p className="text-xs mt-1" style={{ color: 'var(--fg-3)' }}>/{durationLabels[duration]}</p>
            ) : (
              <p className="text-xs mt-1" style={{ color: 'var(--fg-3)' }}>
                /{durationLabels[duration]} ·{' '}
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                  ~{formatVnd(perMonthPrice(TIER_PRICES.ProIndividual[duration], duration))}/mo
                </span>
              </p>
            )}
          </div>

          <FeatureList items={proIndividualFeatures} />

          {isCurrentPlan('ProIndividual') ? (
            <Button disabled className="mt-auto" style={{ background: 'var(--xn-sage-500)', color: '#fff', cursor: 'default' }}>
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
          className="relative flex flex-col gap-4 rounded-2xl p-6"
          style={{
            border: isCurrentPlan('ProCoach')
              ? '2px solid var(--xn-sage-500)'
              : '2px solid var(--color-warning)',
            background: 'var(--bg-2)',
          }}
        >
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-bold whitespace-nowrap"
            style={{ background: isCurrentPlan('ProCoach') ? 'var(--xn-sage-500)' : 'var(--color-warning)', color: '#fff' }}
          >
            {isCurrentPlan('ProCoach') ? 'Current Plan' : 'For Coaches'}
          </div>

          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: isCurrentPlan('ProCoach') ? 'var(--color-success)' : 'var(--color-warning)' }}
            >
              {TIER_LABELS.ProCoach}
            </p>
            <p className="mt-1 text-3xl font-bold" style={{ color: 'var(--fg-1)' }}>
              {formatVnd(TIER_PRICES.ProCoach[duration])}
            </p>
            {duration === 1 ? (
              <p className="text-xs mt-1" style={{ color: 'var(--fg-3)' }}>/{durationLabels[duration]}</p>
            ) : (
              <p className="text-xs mt-1" style={{ color: 'var(--fg-3)' }}>
                /{durationLabels[duration]} ·{' '}
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                  ~{formatVnd(perMonthPrice(TIER_PRICES.ProCoach[duration], duration))}/mo
                </span>
              </p>
            )}
          </div>

          <FeatureList items={proCoachFeatures} />

          {isCurrentPlan('ProCoach') ? (
            <Button disabled className="mt-auto" style={{ background: 'var(--xn-sage-500)', color: '#fff', cursor: 'default' }}>
              ✓ Your Current Plan
            </Button>
          ) : (
            <Button
              onClick={() => onSelect('ProCoach', duration)}
              loading={loading}
              className="mt-auto"
              style={{ background: 'var(--color-warning)', color: '#fff' }}
            >
              Upgrade to Pro Coach
            </Button>
          )}
        </motion.div>

      </div>
    </div>
  )
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((label, i) => (
        <li key={label} className="flex items-center gap-2 text-sm">
          <Check
            size={14}
            className="shrink-0"
            style={{ color: i === 0 ? 'var(--fg-4)' : 'var(--color-success)' }}
          />
          <span style={{ color: i === 0 ? 'var(--fg-3)' : 'var(--fg-2)', fontStyle: i === 0 ? 'italic' : 'normal' }}>
            {label}
          </span>
        </li>
      ))}
    </ul>
  )
}
