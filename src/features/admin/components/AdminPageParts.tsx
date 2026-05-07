import type { ReactNode } from 'react'
import { Card } from '@/shared/components/Card'

export function AdminHeader({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
      <div>
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
    </div>
  )
}

export function MetricCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card animate={false} className="min-h-[96px]">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-3 text-2xl font-bold text-text">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <Card><p className="py-8 text-center text-sm text-muted">{children}</p></Card>
}

export function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}
