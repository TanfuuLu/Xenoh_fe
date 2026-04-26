import { motion } from 'framer-motion'
import { slideUp } from '@/shared/utils/motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function AuthLayout({ children }: Props) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'var(--xn-clay-050)' }}
    >
      {/* Grain texture overlay */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: 'url(/assets/grain.svg)',
          backgroundSize: '300px',
          opacity: 0.04,
        }}
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={slideUp}
        className="relative w-full max-w-md"
      >
        {/* Brand */}
        <div className="mb-8 text-center">
          <img src="/assets/logo-mark.svg" alt="Xenoh" width={48} height={48} className="mx-auto mb-3" />
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 36,
              letterSpacing: '-0.02em',
              color: 'var(--xn-clay-700)',
              margin: 0,
            }}
          >
            Xenoh
          </h1>
          <p style={{ color: 'var(--fg-3)', marginTop: 4, fontSize: 14 }}>
            Fitness coaching platform
          </p>
        </div>

        {/* Card */}
        <div
          className="xn-card"
          style={{ borderRadius: 20, padding: '32px 36px', boxShadow: 'var(--sh-lg)' }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  )
}
