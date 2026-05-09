import { Lightbulb } from 'lucide-react'
import { useT } from '@/shared/i18n'
import { TIPS } from '../data/tips'
import type { TipPlacement } from '../types'
import { TipIcon } from './TipIcon'

interface Props {
  /** Either a specific tip id or a placement; if a placement is given, the
   *  first tip flagged for that placement (matching the user's audience) wins. */
  tipId?: string
  placement?: TipPlacement
  /** Optional audience filter; defaults to "all" so individual + coach both render. */
  audience?: 'all' | 'individual' | 'coach'
}

/**
 * Lightweight contextual hint card used on workout / progress pages.
 * Doesn't render anything if the referenced tip is missing — fail safe.
 */
export function InlineTip({ tipId, placement, audience = 'all' }: Props) {
  const t = useT()

  const tip = (() => {
    if (tipId) return TIPS.find((x) => x.id === tipId) ?? null
    if (placement) {
      return TIPS.find(
        (x) =>
          x.placements?.includes(placement) &&
          (x.audience === 'all' || audience === 'all' || x.audience === audience),
      ) ?? null
    }
    return null
  })()

  if (!tip) return null

  const entry = (t.tips.entries as Record<string, { title: string; body: string }>)[tip.id]
  if (!entry) return null

  return (
    <div
      className="flex items-start gap-3 rounded-xl p-3"
      style={{
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.22)',
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'rgba(245,158,11,0.18)', color: 'var(--color-warning)' }}
      >
        <Lightbulb size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-text">
          <TipIcon name={tip.icon} size={13} />
          {entry.title}
        </p>
        <p className="mt-0.5 text-xs text-muted">{entry.body}</p>
      </div>
    </div>
  )
}
