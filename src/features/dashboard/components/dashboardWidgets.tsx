import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Activity, ClipboardList, Dumbbell, Sparkles, Utensils, Weight } from 'lucide-react'
import { softCardItem } from '@/shared/utils/motion'
import { cn } from '@/shared/utils/cn'

const LIGHT_CARD_BORDER = 'var(--surface-border-soft)'

export function MetricCard({ icon, label, value, sub, accent }: { icon: ReactNode; label: string; value: string; sub?: string; accent?: string }) {
  return (
    <motion.div variants={softCardItem} className="xn-mini-card rounded-xl border bg-panel p-4" style={{ borderColor: LIGHT_CARD_BORDER }}>
      <div
        className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ background: accent ? `${accent}20` : 'var(--bg-surface)', color: accent ?? 'var(--color-primary)' }}
      >
        {icon}
      </div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-bold text-text">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </motion.div>
  )
}

export function LevelCard({
  levelLabel,
  title,
  xpText,
  progress,
}: {
  levelLabel: string
  title: string
  xpText: string
  progress: number
}) {
  return (
    <motion.div variants={softCardItem} className="xn-mini-card rounded-xl border bg-panel p-4" style={{ borderColor: LIGHT_CARD_BORDER }}>
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{levelLabel}</p>
            <p className="mt-1 text-lg font-bold text-text">{title}</p>
          </div>
          <p className="text-sm font-semibold text-text">{xpText}</p>
        </div>
        <ProgressBar value={progress} />
      </div>
    </motion.div>
  )
}

export function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <motion.div variants={softCardItem} className="xn-mini-card rounded-xl border bg-panel p-3" style={{ borderColor: LIGHT_CARD_BORDER }}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-semibold text-text">{value}</p>
    </motion.div>
  )
}

export function Macro({ label, logged, target }: { label: string; logged: number; target: number | null }) {
  return (
    <motion.div variants={softCardItem} className="xn-mini-card rounded-lg border p-3" style={{ borderColor: LIGHT_CARD_BORDER }}>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-semibold text-text">{Math.round(logged)} / {target == null ? '-' : Math.round(target)}g</p>
    </motion.div>
  )
}

export function PanelHeader({
  icon,
  label,
  title,
  subtitle,
  accent,
}: {
  icon: ReactNode
  label: string
  title: string
  subtitle?: string
  accent?: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: accent ? `${accent}20` : 'var(--bg-panel)', color: accent ?? 'var(--color-primary)' }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <h2 className="mt-0.5 break-words text-lg font-semibold text-text">{title}</h2>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
    </div>
  )
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full', className)} style={{ background: 'var(--border-1)' }}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

export function ActionIcon({ type }: { type: string }) {
  if (type.includes('Workout')) return <Dumbbell size={17} />
  if (type.includes('Nutrition')) return <Utensils size={17} />
  if (type.includes('Bodyweight')) return <Weight size={17} />
  if (type.includes('Profile')) return <Activity size={17} />
  if (type.includes('Plan')) return <ClipboardList size={17} />
  return <Sparkles size={17} />
}

export function insightStyle(severity: string): CSSProperties {
  if (severity === 'Warning' || severity === 'Critical') {
    return { borderColor: 'rgba(245,158,11,0.28)', background: 'rgba(245,158,11,0.08)' }
  }
  if (severity === 'Positive') {
    return { borderColor: 'rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.08)' }
  }
  return { borderColor: 'var(--border-1)', background: 'var(--bg-2)' }
}
