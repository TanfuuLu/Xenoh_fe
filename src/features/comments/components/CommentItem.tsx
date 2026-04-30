import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { UserAvatar } from '@/shared/components/UserAvatar'
import type { CommentResponse } from '../types'

interface Props {
  comment: CommentResponse
  onDelete: (id: string) => void
  isDeleting: boolean
}

export function CommentItem({ comment, onDelete, isDeleting }: Props) {
  const userId = useAuthStore((s) => s.user?.id)
  const isOwn = userId === comment.authorId

  return (
    <div className="flex gap-3 group">
      <UserAvatar name={comment.authorName} size={32} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>
            {comment.authorName}
          </span>
          <span className="text-xs" style={{ color: 'var(--fg-3)' }}>
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--fg-2)', margin: 0 }}>
          {comment.content}
        </p>
      </div>

      {isOwn && (
        <button
          onClick={() => onDelete(comment.id)}
          disabled={isDeleting}
          className="flex-shrink-0 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            width: 28, height: 28,
            background: 'none', border: 'none',
            cursor: isDeleting ? 'not-allowed' : 'pointer',
            color: 'var(--color-danger)', opacity: isDeleting ? 0.4 : undefined,
          }}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}
