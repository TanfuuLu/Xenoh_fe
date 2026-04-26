import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}
const panel = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, damping: 28, stiffness: 300 } },
}

export function Modal({ open, onClose, title, children, className }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdrop}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(58, 42, 30, 0.45)' }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="panel"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={panel}
              className={cn('xn-card w-full max-w-md', className)}
              style={{ borderRadius: 20, padding: '28px 28px', boxShadow: 'var(--sh-xl)' }}
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
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'; (e.currentTarget as HTMLElement).style.color = 'var(--fg-1)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--fg-3)'; }}
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
    </AnimatePresence>
  )
}
