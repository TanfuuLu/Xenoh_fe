import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Trophy, Medal } from 'lucide-react'
import { Spinner } from '@/shared/components/Spinner'
import { cn } from '@/shared/utils/cn'
import { staggerContainer, slideUp, fadeIn } from '@/shared/utils/motion'
import { useAuthStore } from '@/features/auth'
import { useLeaderboard } from '../api/useLeaderboard'
import type { Big3Lift, Big3LeaderboardEntry } from '../types'

const LIFT_TABS: { key: Big3Lift; label: string }[] = [
  { key: 'total',    label: 'Total'     },
  { key: 'squat',    label: 'Squat'     },
  { key: 'bench',    label: 'Bench'     },
  { key: 'deadlift', label: 'Deadlift'  },
]

const MEDAL_COLORS = [
  { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)', text: '#f59e0b', label: 'Gold'   },
  { bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.4)', text: '#94a3b8', label: 'Silver' },
  { bg: 'rgba(180,120,60,0.15)', border: 'rgba(180,120,60,0.4)', text: '#b4783c', label: 'Bronze' },
]

function getScore(entry: Big3LeaderboardEntry, lift: Big3Lift): number | null {
  if (lift === 'total')    return entry.total > 0 ? entry.total : null
  if (lift === 'squat')    return entry.squatPr
  if (lift === 'bench')    return entry.benchPr
  if (lift === 'deadlift') return entry.deadliftPr
  return null
}

function sorted(entries: Big3LeaderboardEntry[], lift: Big3Lift): Big3LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    const sa = getScore(a, lift) ?? -1
    const sb = getScore(b, lift) ?? -1
    return sb - sa
  })
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()
}

export function LeaderboardPage() {
  const [activeLift, setActiveLift] = useState<Big3Lift>('total')
  const shouldReduce = useReducedMotion()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const { data, isLoading, isError } = useLeaderboard()

  const ranked = data ? sorted(data, activeLift) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy size={22} style={{ color: 'var(--color-warning)' }} />
        <div>
          <h1 className="text-2xl font-bold text-text">Big 3 Leaderboard</h1>
          <p className="text-sm text-muted">Ranked by personal record weights</p>
        </div>
      </div>

      {/* Lift tabs */}
      <div
        className="flex gap-1 rounded-xl p-1 w-fit"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
      >
        {LIFT_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveLift(tab.key)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-200',
              activeLift === tab.key ? 'text-text' : 'text-muted hover:text-text',
            )}
            style={
              activeLift === tab.key
                ? { background: 'var(--bg-1)', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }
                : { background: 'transparent' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          className="rounded-xl px-5 py-4 text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-danger)' }}
        >
          Could not load leaderboard. The backend endpoint may not be available yet.
        </div>
      )}

      {/* Podium — top 3 */}
      {!isLoading && !isError && ranked.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLift + '-podium'}
            {...(shouldReduce ? {} : fadeIn)}
            className="grid grid-cols-3 gap-3"
          >
            {ranked.slice(0, 3).map((entry, i) => {
              const score = getScore(entry, activeLift)
              const medal = MEDAL_COLORS[i]
              const isMe = entry.userId === currentUserId
              return (
                <motion.div
                  key={entry.userId}
                  variants={slideUp}
                  initial={shouldReduce ? false : 'hidden'}
                  animate="visible"
                  transition={{ delay: i * 0.08 }}
                  className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center"
                  style={{ background: medal.bg, border: `1px solid ${medal.border}` }}
                >
                  {/* Medal icon */}
                  <Medal size={20} style={{ color: medal.text }} />

                  {/* Avatar */}
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      background: isMe ? 'var(--color-primary)' : 'var(--bg-3)',
                      color: isMe ? '#fff' : 'var(--fg-1)',
                      border: isMe ? '2px solid var(--color-primary)' : '2px solid var(--border-1)',
                    }}
                  >
                    {initials(entry.fullName)}
                  </div>

                  {/* Name */}
                  <p
                    className="text-sm font-semibold leading-tight max-w-full truncate"
                    style={{ color: isMe ? 'var(--color-primary)' : 'var(--fg-1)' }}
                    title={entry.fullName}
                  >
                    {entry.fullName}
                    {isMe && <span className="ml-1 text-xs font-normal text-muted">(you)</span>}
                  </p>

                  {/* Score */}
                  <p className="text-xl font-bold" style={{ color: medal.text }}>
                    {score != null ? `${score} kg` : '—'}
                  </p>

                  {/* Bodyweight */}
                  {entry.bodyweight != null && (
                    <p className="text-xs" style={{ color: 'var(--fg-3)' }}>
                      BW: {entry.bodyweight} kg
                    </p>
                  )}

                  {/* Rank badge */}
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ background: medal.border, color: medal.text }}
                  >
                    #{i + 1}
                  </span>
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Full ranked list */}
      {!isLoading && !isError && ranked.length > 0 && (
        <motion.div
          key={activeLift + '-list'}
          initial={shouldReduce ? false : 'hidden'}
          animate="visible"
          variants={staggerContainer}
          className="overflow-hidden rounded-2xl"
          style={{ border: '1px solid var(--border-1)' }}
        >
          {/* Table header */}
          <div
            className="grid items-center px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
            style={{
              gridTemplateColumns: '48px 1fr 80px 80px 80px 90px 80px',
              background: 'var(--bg-2)',
              color: 'var(--fg-3)',
              borderBottom: '1px solid var(--border-1)',
            }}
          >
            <span>#</span>
            <span>Athlete</span>
            <span className="text-right">Squat</span>
            <span className="text-right">Bench</span>
            <span className="text-right">Deadlift</span>
            <span className="text-right">Total</span>
            <span className="text-right">BW</span>
          </div>

          <AnimatePresence mode="wait">
            {ranked.map((entry, i) => {
              const score    = getScore(entry, activeLift)
              const isMe     = entry.userId === currentUserId
              const medal    = i < 3 ? MEDAL_COLORS[i] : null
              return (
                <motion.div
                  key={entry.userId}
                  variants={slideUp}
                  layout
                  className="grid items-center px-4 py-3"
                  style={{
                    gridTemplateColumns: '48px 1fr 80px 80px 80px 90px 80px',
                    borderBottom: '1px solid var(--border-1)',
                    background: isMe
                      ? 'rgba(99,102,241,0.06)'
                      : i % 2 === 0 ? 'var(--bg-1)' : 'var(--bg-2)',
                  }}
                >
                  {/* Rank */}
                  <span
                    className="text-sm font-bold"
                    style={{ color: medal ? medal.text : 'var(--fg-3)' }}
                  >
                    {i + 1}
                  </span>

                  {/* Athlete */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background: isMe ? 'var(--color-primary)' : 'var(--bg-3)',
                        color: isMe ? '#fff' : 'var(--fg-2)',
                      }}
                    >
                      {initials(entry.fullName)}
                    </div>
                    <span
                      className="truncate text-sm font-medium"
                      style={{ color: isMe ? 'var(--color-primary)' : 'var(--fg-1)' }}
                    >
                      {entry.fullName}
                      {isMe && <span className="ml-1.5 text-xs font-normal text-muted">(you)</span>}
                    </span>
                  </div>

                  {/* Squat */}
                  <span
                    className="text-right text-sm"
                    style={{
                      color: activeLift === 'squat' && score != null ? 'var(--fg-1)' : 'var(--fg-3)',
                      fontWeight: activeLift === 'squat' ? 600 : 400,
                    }}
                  >
                    {entry.squatPr != null ? `${entry.squatPr}` : '—'}
                  </span>

                  {/* Bench */}
                  <span
                    className="text-right text-sm"
                    style={{
                      color: activeLift === 'bench' && score != null ? 'var(--fg-1)' : 'var(--fg-3)',
                      fontWeight: activeLift === 'bench' ? 600 : 400,
                    }}
                  >
                    {entry.benchPr != null ? `${entry.benchPr}` : '—'}
                  </span>

                  {/* Deadlift */}
                  <span
                    className="text-right text-sm"
                    style={{
                      color: activeLift === 'deadlift' && score != null ? 'var(--fg-1)' : 'var(--fg-3)',
                      fontWeight: activeLift === 'deadlift' ? 600 : 400,
                    }}
                  >
                    {entry.deadliftPr != null ? `${entry.deadliftPr}` : '—'}
                  </span>

                  {/* Total */}
                  <span
                    className="text-right text-sm"
                    style={{
                      color: activeLift === 'total' ? 'var(--fg-1)' : 'var(--fg-3)',
                      fontWeight: activeLift === 'total' ? 600 : 400,
                    }}
                  >
                    {entry.total > 0 ? `${entry.total}` : '—'}
                  </span>

                  {/* Bodyweight */}
                  <span className="text-right text-sm" style={{ color: 'var(--fg-3)' }}>
                    {entry.bodyweight != null ? `${entry.bodyweight}` : '—'}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty */}
      {!isLoading && !isError && ranked.length === 0 && (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted">
          <Trophy size={32} style={{ opacity: 0.3 }} />
          <p className="text-sm">No data yet — start logging your lifts!</p>
        </div>
      )}
    </div>
  )
}
