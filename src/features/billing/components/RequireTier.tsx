import type { ReactNode } from 'react'
import { useAuthStore } from '@/features/auth'
import { useSubscription } from '@/features/billing/api/useSubscription'
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
  const isAdmin = useAuthStore((s) => s.user?.roles?.includes('Admin') ?? false)
  const isCoach = useAuthStore((s) => s.user?.roles?.includes('Coach') ?? false)
  const { data: subscription, isLoading } = useSubscription()

  if (isAdmin) return <>{children}</>
  if (isLoading) return null
  if (subscription?.isActive && subscription?.tier !== 'Free') return <>{children}</>

  const requiredTier: Exclude<PlanTier, 'Free'> = isCoach ? 'ProCoach' : 'ProIndividual'
  return <UpgradePrompt feature={feature} requiredTier={requiredTier} />
}
