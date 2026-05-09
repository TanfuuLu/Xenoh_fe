import { motion, AnimatePresence } from 'framer-motion'
import { Ban, ShieldOff } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Spinner } from '@/shared/components/Spinner'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useMyBlocks, useUnblockUser } from '../api/useBlocks'

export function BlocklistPage() {
  const { data: blocks, isLoading } = useMyBlocks()
  const { mutate: unblock, isPending } = useUnblockUser()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const list = blocks ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Người dùng đã chặn</h1>
        <p className="mt-1 text-sm text-muted">
          Người dùng trong danh sách này không thể gửi yêu cầu kết nối, đánh giá hoặc báo cáo bạn.
        </p>
      </div>

      {list.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-10 text-center text-muted">
          <ShieldOff size={28} />
          <p>Bạn chưa chặn ai.</p>
        </Card>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-3"
        >
          <AnimatePresence>
            {list.map((entry) => (
              <motion.div
                key={entry.id}
                variants={slideUp}
                layout
                className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar name={entry.fullName} imageUrl={entry.avatarUrl} size={44} variant="primary" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-text">{entry.fullName}</p>
                    {entry.reason && (
                      <p className="mt-0.5 truncate text-xs text-muted">Lý do: {entry.reason}</p>
                    )}
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--fg-3)' }}>
                      Chặn từ {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={isPending}
                  onClick={() => unblock(entry.blockedUserId)}
                >
                  <Ban size={15} /> Bỏ chặn
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
