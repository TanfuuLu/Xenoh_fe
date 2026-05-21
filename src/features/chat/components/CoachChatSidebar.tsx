import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { useAuthStore } from '@/features/auth'
import { useChatStore } from '../store/chatStore'
import { useMarkMessagesRead, useMessages, useSendMessage } from '../api/useMessages'
import { MessageInput } from './MessageInput'
import { MessageList } from './MessageList'
import { useEffect, useMemo } from 'react'

interface ChatClient {
  relationshipId: string
  fullName: string
  avatarUrl?: string | null
}

interface Props {
  clients: ChatClient[]
  onClose?: () => void
}

function ChatArea({
  relationshipId,
  currentUserId,
}: {
  relationshipId: string
  currentUserId: string
}) {
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
    <>
      <MessageList
        messages={allMessages}
        currentUserId={currentUserId}
        isLoading={isLoading}
        hasMore={!!hasNextPage}
        onLoadMore={() => void fetchNextPage()}
        isFetchingMore={isFetchingNextPage}
      />
      <MessageInput
        onSend={(content) => sendMessage(content)}
        isPending={isSending}
      />
    </>
  )
}

export function CoachChatSidebar({ clients, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const currentUserId = useAuthStore((s) => s.user?.id ?? '')
  const unreadCounts = useChatStore((s) => s.unreadCounts)

  const selected = clients.find((c) => c.relationshipId === selectedId) ?? null

  return (
    <div
      className="fixed right-4 z-10 flex flex-row overflow-hidden rounded-2xl"
      style={{
        top: '80px',
        bottom: '16px',
        width: '22rem',
        background: 'var(--bg-2)',
        border: '1px solid var(--border-1)',
      }}
    >
      {/* Chat area — left */}
      <div className="flex min-w-0 flex-1 flex-col">
        {selected ? (
          <ChatArea
            key={selected.relationshipId}
            relationshipId={selected.relationshipId}
            currentUserId={currentUserId}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4">
            <p className="text-center text-sm" style={{ color: 'var(--fg-3)' }}>
              Chọn client để bắt đầu trò chuyện
            </p>
          </div>
        )}
      </div>

      {/* Avatar selector strip — right */}
      <div
        className="flex w-14 flex-shrink-0 flex-col items-center gap-3 overflow-y-auto py-3"
        style={{ borderLeft: '1px solid var(--border-1)' }}
      >
        {onClose && (
          <button
            type="button"
            title="Close chat"
            onClick={onClose}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors"
            style={{ color: 'var(--fg-3)', background: 'var(--bg-3)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--fg-1)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--fg-3)' }}
          >
            <X size={13} />
          </button>
        )}
        {clients.map((client) => {
          const unread = unreadCounts[client.relationshipId] ?? 0
          const isSelected = selectedId === client.relationshipId
          return (
            <button
              key={client.relationshipId}
              type="button"
              title={client.fullName}
              onClick={() => setSelectedId(isSelected ? null : client.relationshipId)}
              className="relative flex-shrink-0"
            >
              <span
                className={cn('block rounded-full transition-all duration-150')}
                style={
                  isSelected
                    ? { outline: '2px solid var(--color-primary)', outlineOffset: '2px' }
                    : undefined
                }
              >
                <UserAvatar
                  name={client.fullName}
                  imageUrl={client.avatarUrl}
                  size={36}
                  variant="primary"
                />
              </span>
              {unread > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ background: 'var(--color-danger)' }}
                >
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
