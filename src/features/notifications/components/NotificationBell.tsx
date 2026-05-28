import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useNotificationStore } from '../store/notificationStore'
import { useNotifications } from '../api/useNotifications'
import { NotificationPanel } from './NotificationPanel'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const containerRef = useRef<HTMLDivElement>(null)

  useNotifications()

  useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="xn-icon-button relative flex items-center justify-center rounded-lg"
        style={{
          width: 36, height: 36,
          cursor: 'pointer',
        }}
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
          <div className="relative z-30">
            <NotificationPanel onClose={() => setOpen(false)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
