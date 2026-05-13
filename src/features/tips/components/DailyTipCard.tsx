import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useLangStore, useT } from '@/shared/i18n'
import { useAuthStore } from '@/features/auth'
import { slideUp } from '@/shared/utils/motion'
import { FEATURE_TIP_ENTRIES } from '../data/tipEntries'
import { TIPS } from '../data/tips'
import type { Tip } from '../types'
import { TipTrigger } from './TipTrigger'

export function DailyTipCard() {
  const t = useT()
  const lang = useLangStore((s) => s.lang)
  const isCoach = useAuthStore((s) => s.user?.roles?.includes('Coach') ?? false)
  const audience = isCoach ? 'coach' : 'individual'

  const tip = useMemo(() => pickDailyTip(audience), [audience])
  if (!tip) return null

  const entry =
    FEATURE_TIP_ENTRIES[lang][tip.id] ??
    (t.tips.entries as Record<string, { title: string; body: string }>)[tip.id]
  if (!entry) return null

  return (
    <motion.div {...slideUp} className="w-fit">
      <TipTrigger label={entry.label ?? t.tips.dailyLabel} title={entry.title} body={entry.body} icon={tip.icon} />
    </motion.div>
  )
}

function pickDailyTip(audience: 'individual' | 'coach'): Tip | null {
  const eligible = TIPS.filter((tip) => tip.audience === 'all' || tip.audience === audience)
  if (eligible.length === 0) return null

  const dayIndex = Math.floor(Date.now() / 86_400_000)
  return eligible[dayIndex % eligible.length]
}
