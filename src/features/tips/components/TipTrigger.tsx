import { Lightbulb } from 'lucide-react'
import { TipIcon } from './TipIcon'
import type { TipIconName } from '../types'

interface Props {
  label?: string
  title: string
  body: string
  icon: TipIconName
}

export function TipTrigger({ label, title, body, icon }: Props) {
  const tooltip = label ? `${label}: ${title}. ${body}` : `${title}. ${body}`

  return (
    <span className="group relative z-[60] inline-flex w-fit hover:z-[9999] focus-within:z-[9999]">
      <button
        type="button"
        aria-label={tooltip}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          background: 'rgba(245,158,11,0.12)',
          borderColor: 'rgba(245,158,11,0.28)',
          color: 'var(--color-warning)',
          boxShadow: '0 8px 16px rgba(80, 59, 40, 0.08)',
        }}
      >
        <Lightbulb size={14} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-[9999] mt-2 hidden max-h-[min(18rem,calc(100vh-2rem))] w-[min(18rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border p-3 text-left shadow-xl group-hover:block group-focus-within:block sm:left-1/2 sm:-translate-x-1/2"
        style={{
          background: 'var(--bg-2)',
          borderColor: 'var(--border-1)',
          color: 'var(--fg-1)',
        }}
      >
        {label && (
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-muted">
            {label}
          </span>
        )}
        <span className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
          <TipIcon name={icon} size={13} />
          {title}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-muted">{body}</span>
      </span>
    </span>
  )
}
