import { useMemo } from 'react'
import { Lightbulb } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/shared/components/Card'
import { useT } from '@/shared/i18n'
import { useAuthStore } from '@/features/auth'
import { slideUp } from '@/shared/utils/motion'
import { TIPS } from '../data/tips'
import type { Tip } from '../types'
import { TipIcon } from './TipIcon'

/**
 * Small "tip of the day" card for the Dashboard. The selection is deterministic —
 * one tip per UTC day per user role — so it stays stable across re-renders and
 * page reloads but rotates daily.
 */
export function DailyTipCard() {
  const t = useT()
  const isCoach = useAuthStore((s) => s.user?.roles?.includes('Coach') ?? false)
  const audience = isCoach ? 'coach' : 'individual'

  const tip = useMemo(() => pickDailyTip(audience), [audience])
  if (!tip) return null

  const entry = (t.tips.entries as Record<string, { title: string; body: string }>)[tip.id]
  if (!entry) return null

  return (
    <motion.div {...slideUp}>
      <Card>
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(245,158,11,0.16)', color: 'var(--color-warning)' }}
          >
            <Lightbulb size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--fg-3)' }}
            >
              {t.tips.dailyLabel}
            </p>
            <h3 className="mt-0.5 flex items-center gap-2 text-base font-semibold text-text">
              <TipIcon name={tip.icon} size={16} />
              {entry.title}
            </h3>
            <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-sm text-muted">
              {entry.body}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

/** Stable per-day deterministic pick. */
function pickDailyTip(audience: 'individual' | 'coach'): Tip | null {
  const eligible = TIPS.filter((tip) => tip.audience === 'all' || tip.audience === audience)
  if (eligible.length === 0) return null

  const dayIndex = Math.floor(Date.now() / 86_400_000)
  return eligible[dayIndex % eligible.length]
}
