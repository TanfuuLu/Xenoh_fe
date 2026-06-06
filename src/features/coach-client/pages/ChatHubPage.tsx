import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { Spinner } from '@/shared/components/Spinner'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { useLangStore } from '@/shared/i18n'
import { ChatPanel } from '@/features/chat/components/ChatPanel'
import { useChatStore } from '@/features/chat/store/chatStore'
import { useMyClients, useCoachDashboard } from '../index'

export function ChatHubPage() {
  const lang = useLangStore((s) => s.lang)
  const tx = chatHubText(lang)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: clients = [], isLoading } = useMyClients()
  const { data: dashboard = [] } = useCoachDashboard()
  const unreadCounts = useChatStore((s) => s.unreadCounts)

  const avatarByClient = new Map(dashboard.map((d) => [d.clientId, d.avatarUrl]))
  const chatClients = clients
    .filter((c) => c.status === 'Active')
    .map((c) => ({
      relationshipId: c.relationshipId,
      fullName: c.fullName,
      avatarUrl: avatarByClient.get(c.clientId) ?? null,
    }))

  const selected = chatClients.find((c) => c.relationshipId === selectedId) ?? null

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-text">
        <MessageCircle size={20} /> {tx.title}
      </h1>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        {/* Client list */}
        <div
          className="flex min-h-0 flex-col overflow-hidden rounded-2xl"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
        >
          <div className="flex-shrink-0 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted" style={{ borderBottom: '1px solid var(--border-1)' }}>
            {tx.clients} ({chatClients.length})
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center"><Spinner /></div>
            ) : chatClients.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted">{tx.noClients}</p>
            ) : (
              chatClients.map((client) => {
                const unread = unreadCounts[client.relationshipId] ?? 0
                const isSelected = selectedId === client.relationshipId
                return (
                  <button
                    key={client.relationshipId}
                    type="button"
                    onClick={() => setSelectedId(client.relationshipId)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                      isSelected ? 'bg-[var(--bg-3)]' : 'hover:bg-[var(--bg-3)]',
                    )}
                  >
                    <UserAvatar name={client.fullName} imageUrl={client.avatarUrl} size={38} variant="primary" />
                    <span className="min-w-0 flex-1 truncate font-medium text-text">{client.fullName}</span>
                    {unread > 0 && (
                      <span
                        className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white"
                        style={{ background: 'var(--color-danger)' }}
                      >
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="min-h-0">
          {selected ? (
            <ChatPanel
              key={selected.relationshipId}
              relationshipId={selected.relationshipId}
              otherPersonName={selected.fullName}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <div
              className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl text-center"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
            >
              <MessageCircle size={28} style={{ color: 'var(--fg-3)' }} />
              <p className="text-sm" style={{ color: 'var(--fg-3)' }}>{tx.empty}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function chatHubText(lang: 'en' | 'vi') {
  return lang === 'vi'
    ? {
      title: 'Trò chuyện với client',
      clients: 'Client',
      noClients: 'Chưa có client đang hoạt động.',
      empty: 'Chọn client để bắt đầu trò chuyện',
    }
    : {
      title: 'Client Chathub',
      clients: 'Clients',
      noClients: 'No active clients yet.',
      empty: 'Select a client to start chatting',
    }
}
