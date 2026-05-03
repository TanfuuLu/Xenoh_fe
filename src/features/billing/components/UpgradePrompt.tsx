import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/shared/components/Button'
import { TIER_LABELS } from '../types'
import type { PlanTier } from '../types'

interface Props {
  feature: string
  requiredTier: Exclude<PlanTier, 'Free'>
}

export function UpgradePrompt({ feature, requiredTier }: Props) {
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
        <p className="font-semibold" style={{ color: 'var(--fg-1)' }}>{feature} is a Pro feature</p>
        <p className="text-sm" style={{ color: 'var(--fg-3)' }}>
          Upgrade to {TIER_LABELS[requiredTier]} to unlock this feature.
        </p>
      </div>
      <Button onClick={() => navigate('/subscription')} size="sm" className="gap-1.5">
        View Plans
      </Button>
    </div>
  )
}
