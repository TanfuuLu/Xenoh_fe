import { useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useAuthStore } from '@/features/auth'
import { useMarkMessagesRead, useMessages, useSendMessage } from '../api/useMessages'
import { useChatStore } from '../store/chatStore'
import { MessageInput } from './MessageInput'
import { MessageList } from './MessageList'

interface Props {
  open: boolean
  onClose: () => void
  relationshipId: string
  otherPersonName: string
}

export function ChatDrawer({ open, onClose, relationshipId, otherPersonName }: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id ?? '')
  const clearUnread = useChatStore((s) => s.clearUnread)

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(relationshipId)

  const { mutate: sendMessage, isPending: isSending } = useSendMessage(relationshipId)
  const { mutate: markRead } = useMarkMessagesRead(relationshipId)

  const allMessages = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  )

  useEffect(() => {
    if (open && relationshipId) {
      markRead()
      clearUnread(relationshipId)
    }
  }, [open, relationshipId, markRead, clearUnread])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer"
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col shadow-xl"
            style={{ background: 'var(--bg-2)', borderLeft: '1px solid var(--border-1)' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--border-1)' }}
            >
              <p
                className="font-semibold"
                style={{ color: 'var(--fg-1)', fontSize: 16 }}
              >
                {otherPersonName}
              </p>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 transition-colors"
                style={{ color: 'var(--fg-3)' }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--fg-1)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--fg-3)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <MessageList
              messages={allMessages}
              currentUserId={currentUserId}
              isLoading={isLoading}
              hasMore={!!hasNextPage}
              onLoadMore={() => void fetchNextPage()}
              isFetchingMore={isFetchingNextPage}
            />

            {/* Input */}
            <MessageInput
              onSend={(content) => sendMessage(content)}
              isPending={isSending}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
