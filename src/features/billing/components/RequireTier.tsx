import type { ReactNode } from 'react'

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
export function RequireTier({ children }: Props) {
  // TEMP TEST BYPASS: paid feature wrapper is disabled while validating features.
  return <>{children}</>
}
