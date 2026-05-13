import { useLangStore, useT } from '@/shared/i18n'
import { TIPS } from '../data/tips'
import { FEATURE_TIP_ENTRIES } from '../data/tipEntries'
import type { TipPlacement } from '../types'
import { TipTrigger } from './TipTrigger'

interface Props {
  tipId?: string
  placement?: TipPlacement
  audience?: 'all' | 'individual' | 'coach'
}

export function InlineTip({ tipId, placement, audience = 'all' }: Props) {
  const t = useT()
  const lang = useLangStore((s) => s.lang)

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

  const entry =
    FEATURE_TIP_ENTRIES[lang][tip.id] ??
    (t.tips.entries as Record<string, { title: string; body: string }>)[tip.id]
  if (!entry) return null

  return <TipTrigger label={entry.label} title={entry.title} body={entry.body} icon={tip.icon} />
}
