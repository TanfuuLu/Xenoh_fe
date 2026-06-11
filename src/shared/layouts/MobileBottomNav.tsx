import React from 'react'
import { NavLink } from 'react-router'
import { motion } from 'framer-motion'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export interface BottomNavItem {
  to: string
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  label: string
  /** match the route exactly (used for index-like routes such as /dashboard) */
  end?: boolean
}

interface Props {
  items: BottomNavItem[]
  moreLabel: string
  onMore: () => void
  /** highlight the "More" tab while the drawer is open */
  moreActive?: boolean
}

/**
 * Fixed bottom tab bar shown only on mobile (`md:hidden`). Surfaces the primary
 * destinations within thumb reach; the trailing "More" tab opens the full
 * navigation drawer for secondary items.
 */
export function MobileBottomNav({ items, moreLabel, onMore, moreActive }: Props) {
  return (
    <nav className="xn-bottomnav md:hidden" aria-label="Primary">
      {items.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => cn('xn-bottomnav-item', isActive && !moreActive && 'active')}
        >
          {({ isActive }) => (
            <>
              {isActive && !moreActive && (
                <motion.span
                  layoutId="bottomnav-active"
                  className="xn-bottomnav-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
                />
              )}
              <span className="xn-bottomnav-icon">
                <Icon size={21} />
              </span>
              <span className="xn-bottomnav-label">{label}</span>
            </>
          )}
        </NavLink>
      ))}

      <button
        type="button"
        onClick={onMore}
        className={cn('xn-bottomnav-item', moreActive && 'active')}
        aria-label={moreLabel}
        aria-expanded={moreActive}
      >
        {moreActive && (
          <motion.span
            layoutId="bottomnav-active"
            className="xn-bottomnav-pill"
            transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
          />
        )}
        <span className="xn-bottomnav-icon">
          <MoreHorizontal size={21} />
        </span>
        <span className="xn-bottomnav-label">{moreLabel}</span>
      </button>
    </nav>
  )
}
