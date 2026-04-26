import { cn } from '@/shared/utils/cn'
import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: ReactNode
}

export function Input({ label, error, leftIcon, className, style, ...props }: Props) {
  // Inline style wins over class-based cascade — avoids the shorthand padding
  // in .xn-input overriding Tailwind's pl-* utilities.
  const inputStyle: CSSProperties = leftIcon
    ? { paddingLeft: '2.25rem', ...style }
    : { ...style }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center"
            style={{ color: 'var(--fg-3)', lineHeight: 0 }}
          >
            {leftIcon}
          </span>
        )}
        <input
          className={cn('xn-input', error && 'error', className)}
          style={inputStyle}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs" style={{ color: 'var(--xn-danger)' }}>
          {error}
        </span>
      )}
    </div>
  )
}
