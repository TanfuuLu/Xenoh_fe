import { cn } from '@/shared/utils/cn'

/** A shimmering placeholder block used while data loads. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md', className)}
      style={{ background: 'var(--bg-3)' }}
    />
  )
}
