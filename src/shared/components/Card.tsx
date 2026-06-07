import { motion, useReducedMotion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { cn } from '@/shared/utils/cn'
import { slideUp } from '@/shared/utils/motion'
import type { CSSProperties, MouseEventHandler, ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  animate?: boolean
  sand?: boolean
  /** Lifts the card slightly on hover (disabled under reduced motion). */
  hover?: boolean
  style?: CSSProperties
  variants?: Variants
  onClick?: MouseEventHandler<HTMLDivElement>
}

export function Card({ children, className, animate = true, sand, hover, style, variants, onClick }: Props) {
  const reduce = useReducedMotion()
  const cls = cn('xn-card', sand && 'sand', hover && 'transition-shadow hover:shadow-md', className)
  const hoverProps = hover && !reduce ? { whileHover: { y: -3 } } : {}
  if (!animate) {
    if (hover && !reduce) {
      return <motion.div {...hoverProps} className={cls} style={style} onClick={onClick}>{children}</motion.div>
    }
    return <div className={cls} style={style} onClick={onClick}>{children}</div>
  }
  if (variants) {
    return (
      <motion.div variants={variants} {...hoverProps} className={cls} style={style} onClick={onClick}>
        {children}
      </motion.div>
    )
  }
  return (
    <motion.div initial="hidden" animate="visible" variants={slideUp} {...hoverProps} className={cls} style={style} onClick={onClick}>
      {children}
    </motion.div>
  )
}
