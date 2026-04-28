import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useNotificationStore } from '../store/notificationStore'
import { useNotifications } from '../api/useNotifications'
import { NotificationPanel } from './NotificationPanel'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  useNotifications()

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center rounded-lg transition-colors"
        style={{
          width: 36, height: 36,
          background: 'none', border: '1px solid var(--border-1)',
          cursor: 'pointer', color: 'var(--fg-2)',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none' }}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span
            className="absolute flex items-center justify-center text-xs font-bold rounded-full"
            style={{
              top: -4, right: -4,
              minWidth: 18, height: 18,
              padding: '0 4px',
              background: 'var(--color-primary)',
              color: '#fff',
              fontSize: 10,
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <div className="relative z-30">
              <NotificationPanel onClose={() => setOpen(false)} />
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
