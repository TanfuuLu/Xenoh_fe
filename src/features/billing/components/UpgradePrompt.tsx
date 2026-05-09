import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/shared/components/Button'
import { useT } from '@/shared/i18n'
import { TIER_LABELS } from '../types'
import type { PlanTier } from '../types'

interface Props {
  feature: string
  requiredTier: Exclude<PlanTier, 'Free'>
}

export function UpgradePrompt({ feature, requiredTier }: Props) {
  const t = useT()
  const ts = t.subscription
  const navigate = useNavigate()

  return (
    <div
      className="flex flex-col items-center gap-3 rounded-2xl px-6 py-10 text-center"
      style={{ border: '1px dashed var(--border-1)', background: 'var(--bg-2)' }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: 'var(--bg-3)' }}
      >
        <Lock size={22} style={{ color: 'var(--fg-3)' }} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-semibold" style={{ color: 'var(--fg-1)' }}>
          {ts.upgradeFeatureProTitle.replace('{feature}', feature)}
        </p>
        <p className="text-sm" style={{ color: 'var(--fg-3)' }}>
          {ts.upgradeUnlockHint.replace('{tier}', TIER_LABELS[requiredTier])}
        </p>
      </div>
      <Button onClick={() => navigate('/subscription')} size="sm" className="gap-1.5">
        {ts.upgradeViewPlans}
      </Button>
    </div>
  )
}
