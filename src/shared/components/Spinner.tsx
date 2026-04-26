import { cn } from '@/shared/utils/cn'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }

export function Spinner({ size = 'md', className }: Props) {
  return (
    <span
      className={cn('inline-block animate-spin rounded-full border-2', sizes[size], className)}
      style={{ borderColor: 'var(--xn-clay-400)', borderTopColor: 'var(--xn-clay-700)' }}
    />
  )
}
