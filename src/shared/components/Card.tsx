import { motion } from 'framer-motion'
import { cn } from '@/shared/utils/cn'
import { slideUp } from '@/shared/utils/motion'
import type { CSSProperties, MouseEventHandler, ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  animate?: boolean
  sand?: boolean
  style?: CSSProperties
  onClick?: MouseEventHandler<HTMLDivElement>
}

export function Card({ children, className, animate = true, sand, style, onClick }: Props) {
  const cls = cn('xn-card', sand && 'sand', className)
  if (!animate) return <div className={cls} style={style} onClick={onClick}>{children}</div>
  return (
    <motion.div initial="hidden" animate="visible" variants={slideUp} className={cls} style={style} onClick={onClick}>
      {children}
    </motion.div>
  )
}
