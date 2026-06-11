import React, { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  LayoutDashboard, ClipboardList, User, Users,
  UserCheck, Menu, X, LogOut, ChevronDown,
  PanelLeftClose, PanelLeftOpen, TrendingUp,
  LockKeyhole, Lock, BookOpen, CreditCard,
  Shield, Utensils, Ban, KeyRound, MessageCircle, MessagesSquare,
  CalendarHeart,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { Link as RouterLink } from 'react-router'
import { useAuthStore } from '@/features/auth'
import { useLogout } from '@/features/auth'
import { useT } from '@/shared/i18n'
import { useLangStore, type Lang } from '@/shared/i18n'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { MobileBottomNav, type BottomNavItem } from '@/shared/layouts/MobileBottomNav'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { useNotificationHub } from '@/features/notifications/hooks/useNotificationHub'
import { useChatUnreadSync } from '@/features/chat'
import { exerciseTrackingKeys } from '@/features/exercise-tracking'
import { useMyCoach } from '@/features/coach-client'
import { useMyPreferences, useUpdatePreferences, useMyProfile } from '@/features/profile'

const MINI_WIDTH  = 64
const FULL_WIDTH  = 264

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mini, setMini] = useState(false)
  const user      = useAuthStore((s) => s.user)
  const isCoach   = useAuthStore((s) => s.user?.roles?.includes('Coach') ?? false)
  const isAdmin   = useAuthStore((s) => s.user?.roles?.includes('Admin') ?? false)
  const isIndividual = !isCoach && !isAdmin
  const { mutate: logout } = useLogout()
  const queryClient = useQueryClient()
  const navigate  = useNavigate()
  const location  = useLocation()
  const shouldReduce = useReducedMotion()
  const t         = useT()
  const tn        = t.nav
  const lang = useLangStore((s) => s.lang)
  const setLang = useLangStore((s) => s.setLang)
  const { data: preferences } = useMyPreferences(!!user)
  const { data: profile } = useMyProfile()
  const isFemale = profile?.gender === 'Female'
  const updatePreferences = useUpdatePreferences()
  const changePasswordLabel = (tn as typeof tn & { changePassword?: string }).changePassword ?? 'Change password'
  const exerciseLibraryLabel = (tn as typeof tn & { exerciseLibrary?: string }).exerciseLibrary ?? 'Exercise Library'
  const isInsightsPage = location.pathname === '/insights'
  const isWidePage = isInsightsPage

  useNotificationHub()
  useChatUnreadSync()
  // A user can have a coach even while holding the Coach role (they're both a
  // coach and someone else's client), so fetch for everyone except admins.
  const { data: myCoach } = useMyCoach(!isAdmin)

  useEffect(() => {
    if (!preferences) return
    setLang(preferences.language)
  }, [preferences, setLang])

  // Theme is fixed to light and weight unit to kg; the payload still carries both for the backend contract.
  function savePreferences(next: { language?: Lang }) {
    const language = next.language ?? lang
    setLang(language)
    updatePreferences.mutate({ language, theme: 'light', weightUnit: 'kg' })
  }

  const individualNav = [
    { to: '/dashboard',         icon: LayoutDashboard,   label: tn.dashboard,         color: '#6366f1' },
    { to: '/plans',             icon: ClipboardList,     label: tn.myPlans,           color: '#f97316' },
    { to: '/exercise-library',  icon: BookOpen,          label: exerciseLibraryLabel,  color: '#06b6d4' },
    { to: '/progress',          icon: TrendingUp,        label: tn.progress,          color: '#f59e0b' },
    { to: '/nutrition',         icon: Utensils,          label: 'Nutrition',          color: '#ec4899' },
    ...(isFemale ? [{ to: '/cycle', icon: CalendarHeart, label: tn.cycle, color: '#f43f5e' }] : []),
    ...(myCoach ? [{ to: '/coach', icon: MessageCircle, label: 'Coach', color: '#8b5cf6' }] : []),
    ...(!myCoach ? [{ to: '/enter-coach-code', icon: KeyRound, label: t.enterCoachCode.label, color: '#8b5cf6' }] : []),
    { to: '/subscription',      icon: CreditCard,        label: 'Subscription',       color: '#eab308' },
  ]

  const coachNav = [
    { to: '/dashboard',       icon: LayoutDashboard,   label: tn.overview,         color: '#6366f1' },
    { to: '/plans',           icon: ClipboardList,     label: tn.myPlans,          color: '#f97316' },
    { to: '/exercise-library', icon: BookOpen,         label: exerciseLibraryLabel, color: '#06b6d4' },
    { to: '/progress',        icon: TrendingUp,        label: tn.progress,         color: '#f59e0b' },
    { to: '/nutrition',       icon: Utensils,          label: 'Nutrition',         color: '#ec4899' },
    ...(isFemale ? [{ to: '/cycle', icon: CalendarHeart, label: tn.cycle, color: '#f43f5e' }] : []),
    { to: '/coach/clients',   icon: UserCheck,         label: tn.clients,          color: '#8b5cf6' },
    { to: '/coach/chat',      icon: MessagesSquare,    label: 'Chat',              color: '#8b5cf6' },
    // A coach can also be someone else's client: show their coach, or let them connect to one.
    ...(myCoach
      ? [{ to: '/coach', icon: MessageCircle, label: 'My Coach', color: '#8b5cf6' }]
      : [{ to: '/enter-coach-code', icon: KeyRound, label: t.enterCoachCode.label, color: '#8b5cf6' }]),
    { to: '/subscription',    icon: CreditCard,        label: 'Subscription',      color: '#eab308' },
  ]

  const adminNav = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: '#6366f1' },
    { to: '/admin/reports',   icon: Shield,          label: 'Reports',   color: '#f97316' },
    { to: '/admin/users',     icon: Users,           label: 'Users',     color: '#22c55e' },
    { to: '/admin/plans',     icon: ClipboardList,   label: 'Plans',     color: '#06b6d4' },
    { to: '/admin/payments',  icon: CreditCard,      label: 'Payments',  color: '#eab308' },
  ]

  const navItems = isAdmin ? adminNav : isCoach ? coachNav : individualNav

  // Mobile bottom bar: the four primary destinations within thumb reach.
  // Everything else (settings, subscription, secondary pages) lives behind "More".
  const bottomNavItems: BottomNavItem[] = isAdmin
    ? [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/admin/users',     icon: Users,           label: 'Users' },
        { to: '/admin/plans',     icon: ClipboardList,   label: 'Plans' },
        { to: '/admin/payments',  icon: CreditCard,      label: 'Payments' },
      ]
    : isCoach
      ? [
          { to: '/dashboard',     icon: LayoutDashboard, label: tn.overview, end: true },
          { to: '/plans',         icon: ClipboardList,   label: tn.myPlans },
          { to: '/coach/clients', icon: UserCheck,       label: tn.clients },
          { to: '/coach/chat',    icon: MessagesSquare,  label: 'Chat' },
        ]
      : [
          { to: '/dashboard', icon: LayoutDashboard, label: tn.dashboard, end: true },
          { to: '/plans',     icon: ClipboardList,   label: tn.myPlans },
          { to: '/progress',  icon: TrendingUp,      label: tn.progress },
          { to: '/nutrition', icon: Utensils,        label: 'Nutrition' },
        ]

  // Individual users see Coach nav items as locked teasers — clicking navigates to the subscription page.
  const lockedCoachNavItems: LockedNavItem[] = isIndividual
    ? [{ icon: UserCheck, label: tn.clients, to: '/subscription?reason=coach-required' }]
    : []

  function handleLogout() {
    logout(undefined, { onSettled: () => navigate('/login') })
  }

  function handleNavClick(to: string) {
    if (to === '/exercise-library') {
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
          lockedNavItems={lockedCoachNavItems}
          user={user}
          isCoach={isCoach}
          isAdmin={isAdmin}
          mini={mini}
          onToggleMini={() => setMini((v) => !v)}
          onLogout={handleLogout}
          onNavClick={handleNavClick}
          lang={lang}
          onSavePreferences={savePreferences}
          changePasswordLabel={changePasswordLabel}
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
                <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
                  <img src="/assets/logo-mark.svg" alt="" width={34} height={34} />
                  <span className="xn-brand-name">Xenoh</span>
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
                lockedNavItems={lockedCoachNavItems}
                user={user}
                isCoach={isCoach}
                isAdmin={isAdmin}
                mini={false}
                onLogout={handleLogout}
                onNavClick={(to) => {
                  handleNavClick(to)
                  setMobileOpen(false)
                }}
                lang={lang}
                onSavePreferences={savePreferences}
                changePasswordLabel={changePasswordLabel}
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
          <Link
            to="/"
            className="md:hidden flex items-center justify-center gap-2"
            style={{ textDecoration: 'none', flex: 1 }}
          >
            <img src="/assets/logo-mark.svg" alt="" width={32} height={32} />
            <span className="xn-brand-name">Xenoh</span>
          </Link>

          {/* Desktop: spacer */}
          <div className="hidden md:block" />

          {/* Right: notification bell (account settings live in the sidebar user menu) */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <main className="xn-main-scroll flex-1 overflow-y-auto">
          <div className={cn('xn-page-container', isWidePage && 'wide', isInsightsPage && 'insights-page')}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={shouldReduce ? false : { opacity: 0, y: 8 }}
                animate={shouldReduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={shouldReduce ? { opacity: 1 } : { opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────── */}
      <MobileBottomNav
        items={bottomNavItems}
        moreLabel={tn.more}
        onMore={() => setMobileOpen(true)}
        moreActive={mobileOpen}
      />
    </div>
  )
}

interface PreferenceRowProps {
  label: string
  children: React.ReactNode
}

function PreferenceRow({ label, children }: PreferenceRowProps) {
  return (
    <div className="flex items-center justify-between gap-3" style={{ marginBottom: 8 }}>
      <span className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>
        {label}
      </span>
      {children}
    </div>
  )
}

interface SegmentedPreferenceProps<T extends string> {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}

function SegmentedPreference<T extends string>({ value, options, onChange }: SegmentedPreferenceProps<T>) {
  const groupId = React.useId()
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        padding: 2,
        background: 'var(--bg-3)',
        border: '1px solid var(--border-1)',
        borderRadius: 8,
      }}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              position: 'relative',
              minWidth: 36,
              padding: '4px 8px',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              background: 'transparent',
              color: active ? 'var(--fg-1)' : 'var(--fg-3)',
              transition: 'color 140ms',
            }}
          >
            {active && (
              <motion.span
                layoutId={groupId}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--bg-2)',
                  borderRadius: 6,
                  boxShadow: 'var(--sh-xs)',
                  zIndex: 0,
                }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Sidebar inner ────────────────────────────────────────────────────────────

interface NavItem {
  to: string
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  label: string
  color?: string
}

interface LockedNavItem {
  icon: React.ComponentType<{ size?: number }>
  label: string
  /** Destination when clicked — defaults to /subscription */
  to?: string
}

interface SidebarInnerProps {
  navItems: NavItem[]
  lockedNavItems?: LockedNavItem[]
  user: { fullName?: string; email?: string; avatarUrl?: string | null } | null
  isCoach: boolean
  isAdmin: boolean
  mini: boolean
  onToggleMini?: () => void
  onLogout: () => void
  onNavClick?: (to: string) => void
  lang: Lang
  onSavePreferences: (next: { language?: Lang }) => void
  changePasswordLabel: string
  hideBrand?: boolean
}

function SidebarInner({
  navItems, lockedNavItems = [], user, isCoach, isAdmin, mini, onToggleMini, onLogout, onNavClick,
  lang, onSavePreferences, changePasswordLabel, hideBrand,
}: SidebarInnerProps) {
  const t  = useT()
  const tn = t.nav
  const [menuOpen, setMenuOpen] = useState(false)

  function handleMenuNav(to: string) {
    setMenuOpen(false)
    onNavClick?.(to)
  }

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
          <span className="xn-nav-section">{isAdmin ? 'Admin' : isCoach ? tn.sectionCoach : tn.sectionTraining}</span>
        )}
        {navItems.map(({ to, icon: Icon, label, color }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard' || to === '/coach'}
            onClick={() => onNavClick?.(to)}
            title={mini ? label : undefined}
            className={({ isActive }) => cn('xn-nav-item', isActive && 'active')}
            style={mini ? { justifyContent: 'center', padding: '10px 0' } : undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-route"
                    className="xn-nav-active-indicator"
                    transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
                  />
                )}
                <Icon size={19} style={color ? { color } : undefined} />
                {!mini && <span className="xn-nav-item-label">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
        {lockedNavItems.map(({ icon: Icon, label, to = '/subscription' }) => (
          <RouterLink
            key={label}
            to={to}
            title={mini ? `${label} — Upgrade to ProCoach` : undefined}
            className="xn-nav-item"
            style={{
              opacity: 0.45,
              cursor: 'pointer',
              textDecoration: 'none',
              ...(mini ? { justifyContent: 'center', padding: '10px 0' } : undefined),
            }}
          >
            <Icon size={19} />
            {!mini && (
              <>
                <span className="xn-nav-item-label" style={{ flex: 1 }}>{label}</span>
                <Lock className="xn-nav-lock" size={12} style={{ color: 'var(--fg-4)', flexShrink: 0 }} />
              </>
            )}
          </RouterLink>
        ))}
      </nav>

      {/* User area + account settings menu (opens upward) */}
      <div style={{ position: 'relative', borderTop: '1px solid var(--border-1)', paddingTop: 10, flexShrink: 0 }}>
        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.13 }}
                className="xn-card"
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: mini ? 0 : 6,
                  right: mini ? 'auto' : 6,
                  width: mini ? 248 : 'auto',
                  zIndex: 20,
                  padding: 0,
                  overflow: 'hidden',
                  borderRadius: 14,
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-1)' }}>
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--fg-1)', margin: 0 }}>{user?.fullName}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--fg-3)', margin: '2px 0 0' }}>{user?.email}</p>
                </div>
                <div style={{ padding: 6 }}>
                  <NavLink to="/profile" onClick={() => handleMenuNav('/profile')} className="xn-nav-item" style={{ fontSize: 13 }}>
                    <User size={15} />
                    {tn.profile}
                  </NavLink>
                  <NavLink to="/change-password" onClick={() => handleMenuNav('/change-password')} className="xn-nav-item" style={{ fontSize: 13 }}>
                    <LockKeyhole size={15} />
                    {changePasswordLabel}
                  </NavLink>
                  <NavLink to="/settings/blocklist" onClick={() => handleMenuNav('/settings/blocklist')} className="xn-nav-item" style={{ fontSize: 13 }}>
                    <Ban size={15} />
                    Blocklist
                  </NavLink>
                  <div style={{ borderTop: '1px solid var(--border-1)', margin: '6px 0', padding: '10px 8px 4px' }}>
                    <p className="text-xs font-semibold uppercase" style={{ color: 'var(--fg-3)', margin: '0 0 8px', letterSpacing: '0.08em' }}>
                      Preferences
                    </p>
                    <PreferenceRow label="Language">
                      <SegmentedPreference
                        value={lang}
                        options={[
                          { value: 'en', label: 'EN' },
                          { value: 'vi', label: 'VI' },
                        ]}
                        onChange={(language) => onSavePreferences({ language })}
                      />
                    </PreferenceRow>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); onLogout() }}
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

        {mini ? (
          <button
            onClick={() => setMenuOpen((v) => !v)}
            title={user?.fullName}
            style={{
              display: 'flex', justifyContent: 'center', width: '100%', padding: '6px 0',
              background: menuOpen ? 'var(--bg-3)' : 'none', border: 'none', cursor: 'pointer', borderRadius: 10,
            }}
          >
            <UserAvatar name={user?.fullName} email={user?.email} imageUrl={user?.avatarUrl} size={34} />
          </button>
        ) : (
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5"
            style={{
              width: '100%', padding: '8px 10px', textAlign: 'left', borderRadius: 10,
              background: menuOpen ? 'var(--bg-3)' : 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <UserAvatar name={user?.fullName} email={user?.email} imageUrl={user?.avatarUrl} size={36} />
            <div className="min-w-0" style={{ flex: 1 }}>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--fg-1)', margin: 0 }}>{user?.fullName}</p>
              <p className="text-xs truncate" style={{ color: 'var(--fg-3)', margin: 0 }}>{user?.email}</p>
            </div>
            <ChevronDown
              size={15}
              style={{ color: 'var(--fg-3)', flexShrink: 0, transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
            />
          </button>
        )}
      </div>
    </>
  )
}
