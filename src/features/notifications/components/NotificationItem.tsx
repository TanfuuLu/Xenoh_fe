import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useNavigate } from 'react-router'
import { Bell, MessageSquare, ClipboardList, AlertTriangle, UserPlus, UserCheck, UserMinus, UserX } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { NotificationResponse } from '../types'

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ size?: number }>, label: string }> = {
  NewComment:      { icon: MessageSquare, label: 'Bình luận mới' },
  PlanAssigned:    { icon: ClipboardList, label: 'Kế hoạch mới' },
  ExerciseWarning: { icon: AlertTriangle, label: 'Cảnh báo' },
  CoachRequest:        { icon: UserPlus,    label: 'Yêu cầu kết nối' },
  CoachAccepted:       { icon: UserCheck,   label: 'Kết nối thành công' },
  DisconnectRequested: { icon: UserMinus,   label: 'Yêu cầu ngắt kết nối' },
  DisconnectAccepted:  { icon: UserX,       label: 'Ngắt kết nối thành công' },
  DisconnectRejected:  { icon: UserCheck,   label: 'Yêu cầu bị từ chối' },
  DisconnectCancelled: { icon: UserCheck,   label: 'Yêu cầu đã hủy' },
}

function resolveLink(notification: NotificationResponse): string | null {
  const { relatedEntityType, relatedEntityId } = notification
  if (!relatedEntityId) return null

  if (relatedEntityType === 'Plan') return `/plans/${relatedEntityId}`

  if (relatedEntityType?.startsWith('Week:')) {
    const planId = relatedEntityType.split(':')[1]
    return `/plans/${planId}/weeks/${relatedEntityId}`
  }

  if (relatedEntityType === 'Day') return `/days/${relatedEntityId}`

  return null
}

interface Props {
  notification: NotificationResponse
  onMarkRead: (id: string) => void
  onClose?: () => void
}

export function NotificationItem({ notification, onMarkRead, onClose }: Props) {
  const config = TYPE_CONFIG[notification.type] ?? { icon: Bell, label: 'Thông báo' }
  const Icon = config.icon
  const navigate = useNavigate()
  const link = resolveLink(notification)

  function handleClick() {
    if (!notification.isRead) onMarkRead(notification.id)
    if (link) {
      onClose?.()
      navigate(link)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left flex items-start gap-3 rounded-lg transition-colors',
        link ? 'cursor-pointer' : 'cursor-default',
      )}
      style={{
        padding: '10px 12px',
        background: notification.isRead ? 'transparent' : 'var(--bg-3)',
        border: 'none',
        cursor: notification.isRead ? 'default' : 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!notification.isRead)
          (e.currentTarget as HTMLElement).style.background = 'var(--bg-4, var(--bg-3))'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = notification.isRead ? 'transparent' : 'var(--bg-3)'
      }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: 32, height: 32,
          background: 'var(--bg-3)',
          color: notification.type === 'ExerciseWarning' || notification.type === 'DisconnectRequested'
            ? 'var(--color-warning)'
            : notification.type === 'CoachAccepted' || notification.type === 'DisconnectRejected' || notification.type === 'DisconnectCancelled'
            ? 'var(--color-success)'
            : notification.type === 'DisconnectAccepted'
            ? 'var(--color-danger)'
            : 'var(--color-primary)',
        }}
      >
        <Icon size={15} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium" style={{ color: 'var(--fg-3)', margin: '0 0 2px' }}>
          {config.label}
        </p>
        <p className="text-sm leading-snug" style={{ color: 'var(--fg-1)', margin: '0 0 4px' }}>
          {notification.message}
        </p>
        <p className="text-xs" style={{ color: 'var(--fg-3)', margin: 0 }}>
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}
        </p>
      </div>

      {!notification.isRead && (
        <div
          className="flex-shrink-0 rounded-full"
          style={{ width: 8, height: 8, background: 'var(--color-primary)', marginTop: 4 }}
        />
      )}
    </button>
  )
}
