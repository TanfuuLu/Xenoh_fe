import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { cn } from '@/shared/utils/cn'
import { slideUp } from '@/shared/utils/motion'
import type { CSSProperties, MouseEventHandler, ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  animate?: boolean
  sand?: boolean
  style?: CSSProperties
  variants?: Variants
  onClick?: MouseEventHandler<HTMLDivElement>
}

export function Card({ children, className, animate = true, sand, style, variants, onClick }: Props) {
  const cls = cn('xn-card', sand && 'sand', className)
  if (!animate) return <div className={cls} style={style} onClick={onClick}>{children}</div>
  if (variants) {
    return (
      <motion.div variants={variants} className={cls} style={style} onClick={onClick}>
        {children}
      </motion.div>
    )
  }
  return (
    <motion.div initial="hidden" animate="visible" variants={slideUp} className={cls} style={style} onClick={onClick}>
      {children}
    </motion.div>
  )
}
