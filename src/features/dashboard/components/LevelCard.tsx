import { motion, useReducedMotion } from 'framer-motion'
import { slideUp } from '@/shared/utils/motion'
import { cn } from '@/shared/utils/cn'
import type { UserProfileResponse } from '@/features/profile/types'

interface Props {
  profile: UserProfileResponse
  variant?: 'default' | 'square'
  className?: string
}

export function LevelCard({ profile, variant = 'default', className }: Props) {
  const shouldReduce = useReducedMotion()

  const level          = profile.level        ?? 1
  const totalXp        = profile.totalXp      ?? 0
  const xpToNextLevel  = profile.xpToNextLevel ?? 1000
  const title          = profile.title         ?? 'Beginner'

  const xpAtLevelStart = (level * (level - 1)) / 2 * 1000
  const xpIntoLevel    = totalXp - xpAtLevelStart
  const pct            = Math.min(100, Math.round((xpIntoLevel / xpToNextLevel) * 100))
  const isSquare       = variant === 'square'

  return (
    <motion.div
      {...(shouldReduce ? {} : slideUp)}
      className={cn(
        'rounded-xl border bg-surface p-4',
        isSquare
          ? 'flex aspect-square min-h-64 flex-col justify-between'
          : 'space-y-3',
        className,
      )}
      style={{ borderColor: 'var(--surface-border-soft)' }}
    >
      <div className={cn('flex gap-3', isSquare ? 'flex-col items-start' : 'items-center justify-between')}>
        <div className={cn('flex gap-3', isSquare ? 'flex-col items-start' : 'items-center')}>
          <div
            className={cn(
              'flex flex-shrink-0 items-center justify-center rounded-xl',
              isSquare ? 'h-20 w-20' : 'h-12 w-12',
            )}
            style={{ background: 'var(--xn-clay-100)' }}
          >
            <span className={cn('font-extrabold text-primary', isSquare ? 'text-4xl' : 'text-xl')}>{level}</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Level</p>
            <p className={cn('font-bold text-text', isSquare ? 'text-2xl' : 'text-base')}>{title}</p>
          </div>
        </div>
        <div className={cn(isSquare ? 'text-left' : 'text-right')}>
          <p className="text-xs text-muted">XP</p>
          <p className={cn('font-semibold text-text', isSquare ? 'text-base' : 'text-sm')}>
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
