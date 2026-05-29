import { BarChart3, Dumbbell } from 'lucide-react'
import { Select } from '@/shared/components/Select'
import { cn } from '@/shared/utils/cn'
import { useT } from '@/shared/i18n'

export type ProgressTab = 'overview' | 'powerlifting'

export function ProgressTabs({
  current,
  onChange,
}: {
  current: ProgressTab
  onChange: (tab: ProgressTab) => void
}) {
  const tp = useT().progress
  const items: Array<{ id: ProgressTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: tp.overviewTab, icon: <BarChart3 size={14} /> },
    { id: 'powerlifting', label: tp.powerliftingTab, icon: <Dumbbell size={14} /> },
  ]
  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl p-1"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
    >
      {items.map((it) => {
        const active = current === it.id
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              active ? 'text-text' : 'text-muted hover:text-text',
            )}
            style={active ? { background: 'var(--bg-3)', border: '1px solid var(--border-1)' } : undefined}
          >
            {it.icon}
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

export function PlanSelect({
  plans,
  value,
  onChange,
  activeLabel,
}: {
  plans: { id: string; name: string; isActive: boolean }[]
  value: string
  onChange: (id: string) => void
  activeLabel: string
}) {
  return (
    <Select
      options={plans.map((p) => ({ value: p.id, label: p.isActive ? `${p.name} (${activeLabel})` : p.name }))}
      value={value}
      onChange={onChange}
      className="min-w-40"
    />
  )
}
