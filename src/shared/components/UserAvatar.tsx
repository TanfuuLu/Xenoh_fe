import { UserRound } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface UserAvatarProps {
  name?: string | null
  email?: string | null
  imageUrl?: string | null
  size?: number
  className?: string
  title?: string
  variant?: 'clay' | 'sage' | 'primary'
}

function getInitials(name?: string | null, email?: string | null) {
  const value = name?.trim() || email?.trim() || ''
  if (!value) return ''

  const parts = value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])

  return parts.length > 1
    ? parts.slice(-2).join('').toUpperCase()
    : value.slice(0, 2).toUpperCase()
}

function resolveImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return null
  if (/^(https?:)?\/\//.test(imageUrl) || imageUrl.startsWith('data:')) return imageUrl
  if (imageUrl.startsWith('/assets/')) return imageUrl

  const baseUrl = (import.meta.env['VITE_API_URL'] as string | undefined)?.replace(/\/$/, '')
  if (!baseUrl) return imageUrl

  return `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
}

export function UserAvatar({
  name,
  email,
  imageUrl,
  size = 40,
  className,
  title,
  variant = 'clay',
}: UserAvatarProps) {
  const initials = getInitials(name, email)
  const fontSize = Math.max(10, Math.round(size * 0.38))
  const resolvedImageUrl = resolveImageUrl(imageUrl)

  const variantStyle =
    variant === 'primary'
      ? {
          background: 'var(--color-primary)',
          color: '#fff',
          borderColor: 'var(--color-primary)',
        }
      : variant === 'sage'
        ? {
            background: 'var(--xn-sage-300)',
            color: '#3d5226',
            borderColor: 'var(--xn-sage-400)',
          }
        : {
            background: 'var(--xn-clay-300)',
            color: 'var(--xn-clay-900)',
            borderColor: 'var(--xn-clay-400)',
          }

  return (
    <span
      className={cn('xn-avatar overflow-hidden', className)}
      title={title ?? name ?? email ?? undefined}
      aria-label={name ?? email ?? 'User'}
      style={{
        width: size,
        height: size,
        fontSize,
        border: '1px solid',
        ...variantStyle,
      }}
    >
      {resolvedImageUrl ? (
        <img
          src={resolvedImageUrl}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : initials ? (
        initials
      ) : (
        <UserRound size={Math.round(size * 0.48)} />
      )}
    </span>
  )
}
