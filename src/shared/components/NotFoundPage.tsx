import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { SearchX } from 'lucide-react'
import { motionProps } from '@/shared/utils/motion'
import { Button } from '@/shared/components/Button'

export function NotFoundPage() {
  return (
    <motion.div
      {...motionProps.slideUp}
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center"
    >
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: 'var(--bg-2)' }}
      >
        <SearchX size={36} style={{ color: 'var(--fg-3)' }} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-text">Not Found</h2>
        <p className="max-w-sm text-muted">
          This content may have been deleted or you no longer have access to it.
        </p>
      </div>
      <Link to="/dashboard">
        <Button variant="secondary">Go to Dashboard</Button>
      </Link>
    </motion.div>
  )
}
