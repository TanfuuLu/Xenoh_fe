import type { Variants } from 'framer-motion'

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

export const softCardGroup: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.03,
      staggerChildren: 0.045,
    },
  },
}

export const softCardItem: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.992 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: 'easeOut' },
  },
}

export const motionProps = {
  fadeIn: { initial: 'hidden', animate: 'visible', variants: fadeIn },
  slideUp: { initial: 'hidden', animate: 'visible', variants: slideUp },
  scaleIn: { initial: 'hidden', animate: 'visible', variants: scaleIn },
  staggerContainer: { initial: 'hidden', animate: 'visible', variants: staggerContainer },
  softCardGroup: { initial: 'hidden', animate: 'visible', variants: softCardGroup },
} as const
