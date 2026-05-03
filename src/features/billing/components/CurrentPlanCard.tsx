import { differenceInDays, format } from 'date-fns'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { useSubscription } from '../api/useSubscription'
import { TierBadge } from './TierBadge'

export function CurrentPlanCard() {
  const { data: subscription, isLoading } = useSubscription()

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center" style={{ minHeight: 100 }}>
        <Spinner />
      </Card>
    )
  }

  const tier = subscription?.tier ?? 'Free'
  const isPro = tier !== 'Free'
  const daysLeft = subscription?.expiresAt
    ? differenceInDays(new Date(subscription.expiresAt), new Date())
    : null
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0
  const isExpired = daysLeft !== null && daysLeft < 0

  return (
    <Card
      animate={false}
      style={{
        border: `1px solid ${isPro ? 'var(--accent)' : 'var(--border-1)'}`,
        background: isPro ? 'color-mix(in oklch, var(--xn-clay-100) 60%, var(--bg-2))' : 'var(--bg-2)',
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--fg-3)' }}>
            Current Plan
          </p>
          <div className="flex items-center gap-3">
            <TierBadge tier={tier} />

            {!isPro && (
              <span className="text-sm" style={{ color: 'var(--fg-3)' }}>
                Select a plan below to upgrade
              </span>
            )}

            {isPro && subscription?.expiresAt && (
              <span
                className="text-sm"
                style={{ color: isExpiringSoon || isExpired ? 'var(--color-danger)' : 'var(--fg-3)' }}
              >
                Expires {format(new Date(subscription.expiresAt), 'dd MMM yyyy')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPro && subscription?.isActive && !isExpired && (
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: 'var(--xn-sage-200)', color: 'var(--color-success)' }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-success)' }} />
              Active
            </div>
          )}

          {isPro && daysLeft !== null && !isExpired && (
            <div
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: isExpiringSoon ? 'var(--xn-warning-bg)' : 'var(--bg-3)',
                color: isExpiringSoon ? 'var(--color-warning)' : 'var(--fg-2)',
              }}
            >
              {daysLeft === 0 ? 'Expires today' : `${daysLeft} days left`}
            </div>
          )}

          {isExpired && (
            <div
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: 'var(--xn-danger-bg)', color: 'var(--color-danger)' }}
            >
              Expired
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
