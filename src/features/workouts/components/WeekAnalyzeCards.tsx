import { motion } from 'framer-motion'
import { slideUp } from '@/shared/utils/motion'
import { type WeekInsight, weekInsightStyle } from './weekAnalyzeHelpers'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  accent?: string
  /** Bright icon color; tints the chip background and colors the icon. */
  iconColor?: string
}

export function StatCard({ icon, label, value, sub, accent, iconColor }: StatCardProps) {
  const chipBg = iconColor ? `color-mix(in oklch, ${iconColor} 16%, transparent)` : accent ?? 'var(--bg-3)'
  const chipColor = iconColor ?? 'var(--color-primary)'
  return (
    <motion.div
      variants={slideUp}
      className="rounded-xl p-4 flex items-start gap-3"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-lg"
        style={{ width: 36, height: 36, background: chipBg, color: chipColor }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs" style={{ color: 'var(--fg-3)', marginBottom: 2 }}>{label}</p>
        <p className="text-xl font-bold text-text">{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>{sub}</p>}
      </div>
    </motion.div>
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-3 py-2 text-sm shadow-lg"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
    >
      <p className="font-semibold text-text mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString()} kg·rep
        </p>
      ))}
    </div>
  )
}

export function WeekInsightCard({ insight }: { insight: WeekInsight }) {
  const styles = weekInsightStyle(insight.severity)
  const Icon = styles.icon
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: styles.border, background: styles.background }}
    >
      <div className="mb-3 flex items-start gap-2">
        <Icon size={17} style={{ color: styles.color, marginTop: 2, flexShrink: 0 }} />
        <div>
          <p className="font-semibold text-text">{insight.title}</p>
          <p className="mt-1 text-sm text-muted">{insight.message}</p>
        </div>
      </div>
      <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}>
        <span className="text-muted">{insight.metricLabel}: </span>
        <span className="font-semibold">{insight.metricValue}</span>
      </div>
    </div>
  )
}
