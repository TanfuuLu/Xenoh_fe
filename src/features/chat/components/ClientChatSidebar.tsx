import { useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { useAuthStore } from '@/features/auth'
import { useChatStore } from '../store/chatStore'
import { useMarkMessagesRead, useMessages, useSendMessage } from '../api/useMessages'
import { MessageInput } from './MessageInput'
import { MessageList } from './MessageList'

interface Props {
  relationshipId: string
  coachName: string
  coachAvatarUrl?: string | null
  onClose?: () => void
}

export function ClientChatSidebar({ relationshipId, coachName, coachAvatarUrl, onClose }: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id ?? '')
  const clearUnread = useChatStore((s) => s.clearUnread)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessages(relationshipId)
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
      className="fixed right-4 z-10 flex flex-col overflow-hidden rounded-2xl"
      style={{
        top: '80px',
        bottom: '16px',
        width: '22rem',
        background: 'var(--bg-2)',
        border: '1px solid var(--border-1)',
      }}
    >
      <div
        className="flex flex-shrink-0 items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-1)' }}
      >
        <UserAvatar name={coachName} imageUrl={coachAvatarUrl} size={32} variant="sage" />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>
          {coachName}
        </p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:shadow-sm"
            style={{ color: 'var(--fg-3)' }}
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <MessageList
        messages={allMessages}
        currentUserId={currentUserId}
        isLoading={isLoading}
        hasMore={!!hasNextPage}
        onLoadMore={() => void fetchNextPage()}
        isFetchingMore={isFetchingNextPage}
      />
      <MessageInput onSend={(content) => sendMessage(content)} isPending={isSending} />
    </div>
  )
}
