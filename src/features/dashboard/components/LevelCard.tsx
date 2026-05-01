import { motion, useReducedMotion } from 'framer-motion'
import { slideUp } from '@/shared/utils/motion'
import type { UserProfileResponse } from '@/features/profile/types'

interface Props {
  profile: UserProfileResponse
}

export function LevelCard({ profile }: Props) {
  const shouldReduce = useReducedMotion()

  const level          = profile.level        ?? 1
  const totalXp        = profile.totalXp      ?? 0
  const xpToNextLevel  = profile.xpToNextLevel ?? 1000
  const title          = profile.title         ?? 'Beginner'

  const xpAtLevelStart = (level * (level - 1)) / 2 * 1000
  const xpIntoLevel    = totalXp - xpAtLevelStart
  const pct            = Math.min(100, Math.round((xpIntoLevel / xpToNextLevel) * 100))

  return (
    <motion.div
      {...(shouldReduce ? {} : slideUp)}
      className="rounded-xl border border-border bg-surface p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'var(--xn-clay-100)' }}
          >
            <span className="text-xl font-extrabold text-primary">{level}</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Level</p>
            <p className="text-base font-bold text-text">{title}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">XP</p>
          <p className="text-sm font-semibold text-text">
            {xpIntoLevel.toLocaleString()} / {xpToNextLevel.toLocaleString()}
          </p>
        </div>
      </div>

      <div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full"
          style={{ background: 'var(--border-1)' }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-primary"
          />
        </div>
        <p className="mt-1 text-right text-xs text-muted">{pct}%</p>
      </div>
    </motion.div>
  )
}
