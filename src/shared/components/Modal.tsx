import { X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/shared/utils/cn'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: Props) {
  const reduce = useReducedMotion()

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(58, 42, 30, 0.45)' }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4"
            onClick={onClose}
          >
            <motion.div
              className={cn('xn-card max-h-[calc(100dvh-24px)] w-full max-w-md overflow-y-auto', className)}
              style={{ borderRadius: 20, boxShadow: 'var(--sh-lg)' }}
              role="dialog"
              aria-modal="true"
              onClick={(event) => event.stopPropagation()}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {title && (
                <div className="mb-5 flex items-center justify-between">
                  <h2
                    className="font-semibold text-lg"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.01em', color: 'var(--fg-1)', margin: 0 }}
                  >
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="rounded-full p-1.5 transition-colors"
                    style={{ color: 'var(--fg-3)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'; (e.currentTarget as HTMLElement).style.color = 'var(--fg-1)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--fg-3)' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
