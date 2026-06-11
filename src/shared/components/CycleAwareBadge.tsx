import { Moon } from 'lucide-react'
import { Badge } from '@/shared/components/Badge'
import { useT } from '@/shared/i18n'
import { useMyProfile } from '@/features/profile'

/**
 * Small indicator shown next to AI feature headers for female users, signalling that
 * the AI advice is personalized to their cycle phase and recent symptom/mood/energy logs.
 * Renders nothing for non-female profiles (or while the profile is loading).
 */
export function CycleAwareBadge({ className }: { className?: string }) {
  const t = useT()
  const { data: profile } = useMyProfile()

  if (profile?.gender !== 'Female') return null

  return (
    <span title={t.insights.cycleAwareTooltip} className="inline-flex">
      <Badge variant="primary" className={`inline-flex items-center gap-1 ${className ?? ''}`}>
        <Moon size={12} />
        {t.insights.cycleAwareBadge}
      </Badge>
    </span>
  )
}
