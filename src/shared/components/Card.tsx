import { motion } from 'framer-motion'
import { cn } from '@/shared/utils/cn'
import { slideUp } from '@/shared/utils/motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  animate?: boolean
  sand?: boolean
}

export function Card({ children, className, animate = true, sand }: Props) {
  const cls = cn('xn-card', sand && 'sand', className)
  if (!animate) return <div className={cls}>{children}</div>
  return (
    <motion.div initial="hidden" animate="visible" variants={slideUp} className={cls}>
      {children}
    </motion.div>
  )
}
