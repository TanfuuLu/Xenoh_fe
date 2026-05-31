import { motion } from 'framer-motion'
import { slideUp } from '@/shared/utils/motion'

export function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <motion.div
      variants={slideUp}
      className="rounded-xl border p-4 space-y-2"
      style={{
        borderColor: highlight ? 'var(--xn-warning)' : 'var(--border-1)',
        background: highlight ? 'var(--xn-warning-bg)' : 'var(--bg-2)',
      }}
    >
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold text-text">{value}</p>
    </motion.div>
  )
}

export function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted">{icon}</span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="font-medium text-text">{value}</p>
      </div>
    </div>
  )
}

export function AnalysisStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-text">{value}</p>
    </div>
  )
}
