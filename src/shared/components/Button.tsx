import { cn } from '@/shared/utils/cn'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }: Props) {
  const base = 'xn-btn xn-interactive'
  const v = variant === 'primary' ? 'primary'
    : variant === 'secondary' ? 'secondary'
    : variant === 'danger' ? 'danger'
    : 'ghost'
  const s = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : ''

  return (
    <button
      className={cn(base, v, s, disabled || loading ? 'opacity-50 cursor-not-allowed' : '', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          style={{ borderTopColor: 'transparent' }}
        />
      )}
      {children}
    </button>
  )
}
