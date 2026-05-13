import { cn } from '@/shared/utils/cn'
import type { ReactNode } from 'react'

interface Props {
  variant?: 'success' | 'danger' | 'warning' | 'default' | 'primary'
  children: ReactNode
  className?: string
}

const tones: Record<NonNullable<Props['variant']>, string> = {
  success: 'sage',
  primary: 'accent',
  warning: 'warn',
  danger:  'danger',
  default: '',
}

export function Badge({ variant = 'default', children, className }: Props) {
  return (
    <span className={cn('xn-chip whitespace-nowrap', tones[variant], className)}>
      {children}
    </span>
  )
}
