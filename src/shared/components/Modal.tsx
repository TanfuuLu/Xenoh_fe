import { X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: Props) {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(58, 42, 30, 0.45)' }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4">
        <div
          className={cn('xn-card max-h-[calc(100dvh-24px)] w-full max-w-md overflow-y-auto', className)}
          style={{ borderRadius: 20, boxShadow: 'var(--sh-lg)' }}
        >
          {title && (
            <div className="mb-5 flex items-center justify-between">
              <h2
                className="font-semibold text-lg"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.01em', color: 'var(--fg-1)', margin: 0 }}
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 transition-colors"
                style={{ color: 'var(--fg-3)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'; (e.currentTarget as HTMLElement).style.color = 'var(--fg-1)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--fg-3)' }}
              >
                <X size={18} />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  )
}
