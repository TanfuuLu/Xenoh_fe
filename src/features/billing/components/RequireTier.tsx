import type { ReactNode } from 'react'
import { Spinner } from '@/shared/components/Spinner'
import { useAuthStore } from '@/features/auth'
import { useSubscription } from '../api/useSubscription'
import { UpgradePrompt } from './UpgradePrompt'
import type { PlanTier } from '../types'

interface Props {
  /** Human-readable feature name shown in the upgrade prompt */
  feature: string
  children: ReactNode
}

/**
 * Wraps any content that requires an active paid subscription.
 * Free-tier users see an UpgradePrompt with the tier appropriate
 * to their role (ProIndividual for Individual, ProCoach for Coach).
 */
export function RequireTier({ feature, children }: Props) {
  const { data: subscription, isLoading } = useSubscription()
  const isCoach = useAuthStore((s) => s.user?.roles?.includes('Coach') ?? false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  const tier = subscription?.tier ?? 'Free'
  const isActivePro = tier !== 'Free' && (subscription?.isActive ?? false)

  if (!isActivePro) {
    const requiredTier: Exclude<PlanTier, 'Free'> = isCoach ? 'ProCoach' : 'ProIndividual'
    return <UpgradePrompt feature={feature} requiredTier={requiredTier} />
  }

  return <>{children}</>
}
