import { motion } from 'framer-motion'
import { motionProps } from '@/shared/utils/motion'
import { useNotificationStore } from '../store/notificationStore'
import { useMarkNotificationRead, useMarkAllNotificationsRead } from '../api/useNotifications'
import { NotificationItem } from './NotificationItem'

interface Props {
  onClose: () => void
}

export function NotificationPanel({ onClose }: Props) {
  const notifications = useNotificationStore((s) => s.notifications)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const { mutate: markRead } = useMarkNotificationRead()
  const { mutate: markAll, isPending: markingAll } = useMarkAllNotificationsRead()

  function handleMarkRead(id: string) {
    markRead(id)
  }

  function handleMarkAll() {
    markAll()
    onClose()
  }

  return (
    <motion.div
      {...motionProps.scaleIn}
      className="xn-card absolute right-0 top-full z-30 mt-2"
      style={{
        width: 360,
        padding: 0,
        overflow: 'hidden',
        borderRadius: 14,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-1)', flexShrink: 0 }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--fg-1)', margin: 0 }}>
          Thông báo {unreadCount > 0 && <span style={{ color: 'var(--color-primary)' }}>({unreadCount})</span>}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className="text-xs transition-colors"
            style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length === 0 ? (
          <div className="text-center" style={{ padding: '32px 16px', color: 'var(--fg-3)' }}>
            <p className="text-sm" style={{ margin: 0 }}>Không có thông báo nào</p>
          </div>
        ) : (
          <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onMarkRead={handleMarkRead} onClose={onClose} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
