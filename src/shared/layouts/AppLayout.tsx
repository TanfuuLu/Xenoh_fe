import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ClipboardList, User, Users,
  UserCheck, Menu, X, LogOut, ChevronDown,
  PanelLeftClose, PanelLeftOpen, ChartNoAxesCombined, TrendingUp,
  LockKeyhole, BookOpen, CreditCard,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useAuthStore } from '@/features/auth'
import { useLogout } from '@/features/auth'
import { useT } from '@/shared/i18n'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { useNotificationHub } from '@/features/notifications/hooks/useNotificationHub'
import { exerciseTrackingKeys } from '@/features/exercise-tracking'

const MINI_WIDTH  = 64
const FULL_WIDTH  = 240

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mini, setMini] = useState(false)
  const user      = useAuthStore((s) => s.user)
  const isCoach   = useAuthStore((s) => s.user?.roles?.includes('Coach') ?? false)
  const { mutate: logout } = useLogout()
  const queryClient = useQueryClient()
  const navigate  = useNavigate()
  const location  = useLocation()
  const t         = useT()
  const tn        = t.nav
  const changePasswordLabel = (tn as typeof tn & { changePassword?: string }).changePassword ?? 'Change password'
  const exerciseLibraryLabel = (tn as typeof tn & { exerciseLibrary?: string }).exerciseLibrary ?? 'Exercise Library'
  const isWeekDetailPage = /^\/plans\/[^/]+\/weeks\/[^/]+$/.test(location.pathname)

  useNotificationHub()

  const individualNav = [
    { to: '/dashboard',    icon: LayoutDashboard, label: tn.dashboard },
    { to: '/plans',        icon: ClipboardList,   label: tn.myPlans },
    { to: '/exercise-library', icon: BookOpen, label: exerciseLibraryLabel },
    { to: '/exercise-tracking', icon: ChartNoAxesCombined, label: tn.exerciseTracking },
    { to: '/progress',     icon: TrendingUp,      label: tn.progress },
    { to: '/coaches',      icon: Users,           label: tn.findCoach },
    { to: '/profile',      icon: User,            label: tn.profile },
    { to: '/subscription', icon: CreditCard,      label: 'Subscription' },
  ]

  const coachNav = [
    { to: '/dashboard',     icon: LayoutDashboard, label: tn.overview },
    { to: '/plans',         icon: ClipboardList,   label: tn.myPlans },
    { to: '/exercise-library', icon: BookOpen, label: exerciseLibraryLabel },
    { to: '/progress',      icon: TrendingUp,      label: tn.progress },
    { to: '/coach/clients', icon: UserCheck,       label: tn.clients },
    { to: '/profile',       icon: User,            label: tn.profile },
    { to: '/subscription',  icon: CreditCard,      label: 'Subscription' },
  ]

  const navItems = isCoach ? coachNav : individualNav

  function handleLogout() {
    setUserMenuOpen(false)
    logout(undefined, { onSettled: () => navigate('/login') })
  }

  function handleNavClick(to: string) {
    if (to === '/exercise-tracking') {
      void queryClient.invalidateQueries({ queryKey: exerciseTrackingKeys.all })
    }
  }

  return (
    <div
      className="xn-shell"
      style={{ '--xn-sidebar-width': `${mini ? MINI_WIDTH : FULL_WIDTH}px` } as React.CSSProperties}
    >
      {/* ── Sidebar (desktop) ─────────────────────────────────────────── */}
      <aside className="xn-sidebar xn-sidebar-desktop hidden md:flex" style={{ width: mini ? MINI_WIDTH : FULL_WIDTH }}>
        <SidebarInner
          navItems={navItems}
          user={user}
          isCoach={isCoach}
          mini={mini}
          onToggleMini={() => setMini((v) => !v)}
          onLogout={handleLogout}
          onNavClick={handleNavClick}
        />
      </aside>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ backgroundColor: 'rgba(58, 42, 30, 0.5)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="xn-sidebar xn-sidebar-mobile fixed inset-y-0 left-0 z-50 flex md:hidden"
              style={{ width: FULL_WIDTH }}
            >
              <div
                className="flex items-center justify-between"
                style={{ height: 60, padding: '0 8px', borderBottom: '1px solid var(--border-1)', flexShrink: 0 }}
              >
                <Link to="/" className="xn-brand-name" style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
                  Xenoh
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  style={{ color: 'var(--fg-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>
              <SidebarInner
                navItems={navItems}
                user={user}
                isCoach={isCoach}
                mini={false}
                onLogout={handleLogout}
                onNavClick={(to) => {
                  handleNavClick(to)
                  setMobileOpen(false)
                }}
                hideBrand
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main column ───────────────────────────────────────────────── */}
      <div className="xn-main min-w-0">

        {/* Top bar */}
        <header className="xn-topbar">
          {/* Mobile: hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden rounded-lg p-1.5"
            style={{ color: 'var(--fg-3)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Menu size={20} />
          </button>

          {/* Mobile: logo */}
          <Link to="/" className="md:hidden xn-brand-name" style={{ textDecoration: 'none', flex: 1, textAlign: 'center' }}>
            Xenoh
          </Link>

          {/* Desktop: spacer */}
          <div className="hidden md:block" />

          {/* Right: lang switcher + notification bell + user menu */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <LanguageSwitcher variant="text" />
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors"
                style={{ background: 'none', border: '1px solid var(--border-1)', cursor: 'pointer' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none' }}
              >
                <UserAvatar name={user?.fullName} email={user?.email} imageUrl={user?.avatarUrl} size={28} />
                <span className="hidden md:block text-sm font-medium max-w-[120px] truncate" style={{ color: 'var(--fg-1)' }}>
                  {user?.fullName ?? user?.email}
                </span>
                <ChevronDown size={13} style={{ color: 'var(--fg-3)', transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.13 }}
                      className="xn-card absolute right-0 top-full z-20 mt-2 w-52"
                      style={{ padding: 0, overflow: 'hidden', borderRadius: 14 }}
                    >
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-1)' }}>
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--fg-1)', margin: 0 }}>{user?.fullName}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--fg-3)', margin: '2px 0 0' }}>{user?.email}</p>
                      </div>
                      <div style={{ padding: 6 }}>
                        <NavLink
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="xn-nav-item"
                          style={{ fontSize: 13 }}
                        >
                          <User size={15} />
                          {tn.profile}
                        </NavLink>
                        <NavLink
                          to="/change-password"
                          onClick={() => setUserMenuOpen(false)}
                          className="xn-nav-item"
                          style={{ fontSize: 13 }}
                        >
                          <LockKeyhole size={15} />
                          {changePasswordLabel}
                        </NavLink>
                        <button
                          onClick={handleLogout}
                          className="xn-nav-item w-full text-left"
                          style={{ fontSize: 13, background: 'none', border: 'none', width: '100%', cursor: 'pointer' }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLElement
                            el.style.background = 'var(--xn-danger-bg)'
                            el.style.color = 'var(--xn-danger)'
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLElement
                            el.style.background = ''
                            el.style.color = ''
                          }}
                        >
                          <LogOut size={15} />
                          {tn.logout}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className={cn('xn-page-container', isWeekDetailPage && 'wide')}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

// ─── Sidebar inner ────────────────────────────────────────────────────────────

interface NavItem {
  to: string
  icon: React.ComponentType<{ size?: number }>
  label: string
}

interface SidebarInnerProps {
  navItems: NavItem[]
  user: { fullName?: string; email?: string; avatarUrl?: string | null } | null
  isCoach: boolean
  mini: boolean
  onToggleMini?: () => void
  onLogout: () => void
  onNavClick?: (to: string) => void
  hideBrand?: boolean
}

function SidebarInner({
  navItems, user, isCoach, mini, onToggleMini, onLogout, onNavClick, hideBrand,
}: SidebarInnerProps) {
  const t  = useT()
  const tn = t.nav

  return (
    <>
      {/* Brand */}
      {!hideBrand && (
        <div className="xn-brand" style={{ justifyContent: mini ? 'center' : 'space-between' }}>
          {mini ? (
            <img src="/assets/logo-mark.svg" alt="Xenoh" width={30} height={30} />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/assets/logo-mark.svg" alt="Xenoh" width={30} height={30} />
                <Link to="/" className="xn-brand-name" style={{ textDecoration: 'none' }}>Xenoh</Link>
              </div>
            </>
          )}

          {onToggleMini && (
            <button
              onClick={onToggleMini}
              title={mini ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--fg-3)', padding: 4, borderRadius: 6,
                display: 'flex', alignItems: 'center', flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--fg-1)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--fg-3)' }}
            >
              {mini ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="xn-nav flex-1" style={{ marginTop: hideBrand ? 8 : 0 }}>
        {!mini && (
          <span className="xn-nav-section">{isCoach ? tn.sectionCoach : tn.sectionTraining}</span>
        )}
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={() => onNavClick?.(to)}
            title={mini ? label : undefined}
            className={({ isActive }) => cn('xn-nav-item', isActive && 'active')}
            style={mini ? { justifyContent: 'center', padding: '10px 0' } : undefined}
          >
            <Icon size={17} />
            {!mini && label}
          </NavLink>
        ))}
      </nav>

      {/* User area */}
      <div style={{ borderTop: '1px solid var(--border-1)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {mini ? (
          <>
            <div
              title={user?.fullName}
              style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}
            >
              <UserAvatar name={user?.fullName} email={user?.email} imageUrl={user?.avatarUrl} size={32} />
            </div>
            <button
              onClick={onLogout}
              title={tn.logout}
              className="xn-nav-item"
              style={{
                justifyContent: 'center', padding: '10px 0',
                background: 'none', border: 'none', cursor: 'pointer', width: '100%',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'var(--xn-danger-bg)'
                el.style.color = 'var(--xn-danger)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.background = ''
                el.style.color = ''
              }}
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2.5" style={{ padding: '6px 10px' }}>
              <UserAvatar name={user?.fullName} email={user?.email} imageUrl={user?.avatarUrl} size={32} />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--fg-1)', margin: 0 }}>{user?.fullName}</p>
                <p className="text-xs truncate" style={{ color: 'var(--fg-3)', margin: 0 }}>{user?.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="xn-nav-item"
              style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'var(--xn-danger-bg)'
                el.style.color = 'var(--xn-danger)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.background = ''
                el.style.color = ''
              }}
            >
              <LogOut size={16} />
              {tn.logout}
            </button>
          </>
        )}
      </div>
    </>
  )
}
