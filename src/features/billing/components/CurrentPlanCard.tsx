import { format } from 'date-fns'
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

  return (
    <Card animate={false} style={{ border: `1px solid ${isPro ? 'var(--color-primary)' : 'var(--border-1)'}` }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--fg-3)' }}>
            Current Plan
          </p>
          <div className="flex items-center gap-3">
            <TierBadge tier={tier} />
            {isPro && subscription?.expiresAt && (
              <span className="text-sm" style={{ color: 'var(--fg-3)' }}>
                Expires {format(new Date(subscription.expiresAt), 'dd MMM yyyy')}
              </span>
            )}
            {!isPro && (
              <span className="text-sm" style={{ color: 'var(--fg-3)' }}>
                Select a plan below to upgrade
              </span>
            )}
          </div>
        </div>

        {isPro && subscription?.isActive && (
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Active
          </div>
        )}
      </div>
    </Card>
  )
}
