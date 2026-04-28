import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import { motionProps } from '@/shared/utils/motion'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'
import type { CommentResponse } from '../types'

interface Props {
  comments: CommentResponse[]
  isLoading: boolean
  onAdd: (content: string) => Promise<void>
  onDelete: (id: string) => void
  isPendingAdd: boolean
  isPendingDelete: boolean
}

export function CommentSection({
  comments, isLoading, onAdd, onDelete, isPendingAdd, isPendingDelete,
}: Props) {
  return (
    <motion.div {...motionProps.slideUp} className="xn-card" style={{ marginTop: 24 }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
        <MessageSquare size={16} style={{ color: 'var(--color-primary)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--fg-1)', margin: 0 }}>
          Bình luận {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        {isLoading ? (
          <p className="text-sm text-center" style={{ color: 'var(--fg-3)', padding: '16px 0' }}>
            Đang tải...
          </p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-center" style={{ color: 'var(--fg-3)', padding: '12px 0' }}>
            Chưa có bình luận nào
          </p>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              onDelete={onDelete}
              isDeleting={isPendingDelete}
            />
          ))
        )}
      </div>

      <CommentForm onSubmit={onAdd} isPending={isPendingAdd} />
    </motion.div>
  )
}
