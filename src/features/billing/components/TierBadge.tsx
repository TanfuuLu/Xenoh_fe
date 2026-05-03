import { cn } from '@/shared/utils/cn'
import { TIER_LABELS } from '../types'
import type { PlanTier } from '../types'

interface Props {
  tier: PlanTier
  className?: string
}

const tierStyles: Record<PlanTier, string> = {
  Free: 'bg-[var(--bg-3)] text-[var(--fg-3)]',
  ProIndividual: 'bg-[var(--color-primary)] text-white',
  ProCoach: 'bg-amber-500 text-white',
}

export function TierBadge({ tier, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tierStyles[tier],
        className,
      )}
    >
      {TIER_LABELS[tier]}
    </span>
  )
}
