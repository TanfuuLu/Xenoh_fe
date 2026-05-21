import { useEffect, useRef } from 'react'
import { Spinner } from '@/shared/components/Spinner'
import { MessageBubble } from './MessageBubble'
import type { MessageResponse } from '../types'

interface Props {
  messages: MessageResponse[]
  currentUserId: string
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  isFetchingMore: boolean
}

export function MessageList({
  messages,
  currentUserId,
  isLoading,
  hasMore,
  onLoadMore,
  isFetchingMore,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function handleScroll() {
    const el = containerRef.current
    if (!el || !hasMore || isFetchingMore) return
    if (el.scrollTop < 80) onLoadMore()
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3"
    >
      {isFetchingMore && (
        <div className="flex justify-center py-2">
          <Spinner />
        </div>
      )}
      {messages.length === 0 && (
        <p
          className="mt-auto text-center text-sm"
          style={{ color: 'var(--fg-3)' }}
        >
          Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
        </p>
      )}
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isMine={msg.senderId === currentUserId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
