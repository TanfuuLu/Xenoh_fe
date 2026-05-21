import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { useChatStore } from '../store/chatStore'
import { ChatDrawer } from './ChatDrawer'

interface Props {
  relationshipId: string
  otherPersonName: string
}

export function ChatButton({ relationshipId, otherPersonName }: Props) {
  const [open, setOpen] = useState(false)
  const unreadCount = useChatStore((s) => s.unreadCounts[relationshipId] ?? 0)

  return (
    <>
      <div className="relative inline-flex">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <MessageCircle size={14} />
          Chat
        </Button>
        {unreadCount > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ background: 'var(--color-danger)' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
      <ChatDrawer
        open={open}
        onClose={() => setOpen(false)}
        relationshipId={relationshipId}
        otherPersonName={otherPersonName}
      />
    </>
  )
}
