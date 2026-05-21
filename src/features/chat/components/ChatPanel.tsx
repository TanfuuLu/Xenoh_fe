import { useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { useAuthStore } from '@/features/auth'
import { useMarkMessagesRead, useMessages, useSendMessage } from '../api/useMessages'
import { useChatStore } from '../store/chatStore'
import { MessageInput } from './MessageInput'
import { MessageList } from './MessageList'

interface Props {
  relationshipId: string
  otherPersonName: string
  onClose: () => void
}

export function ChatPanel({ relationshipId, otherPersonName, onClose }: Props) {
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
    markRead()
    clearUnread(relationshipId)
  }, [relationshipId, markRead, clearUnread])

  return (
    <div
      className="flex h-full flex-col rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
    >
      {/* Header */}
      <div
        className="flex flex-shrink-0 items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-1)' }}
      >
        <p className="font-semibold" style={{ color: 'var(--fg-1)', fontSize: 15 }}>
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
          <X size={16} />
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
    </div>
  )
}
