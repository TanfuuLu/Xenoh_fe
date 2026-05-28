import React, { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  LayoutDashboard, ClipboardList, User, Users,
  UserCheck, Menu, X, LogOut, ChevronDown,
  PanelLeftClose, PanelLeftOpen, TrendingUp,
  LockKeyhole, Lock, BookOpen, CreditCard,
  Shield, Utensils, Ban, KeyRound, MessageCircle,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { Link as RouterLink } from 'react-router'
import { useAuthStore } from '@/features/auth'
import { useLogout } from '@/features/auth'
import { useT } from '@/shared/i18n'
import { useLangStore, type Lang } from '@/shared/i18n'
import { useThemeStore, type Theme } from '@/shared/theme'
import { usePreferenceStore, type WeightUnit } from '@/shared/preferences'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { ThemeToggle } from '@/shared/components/ThemeToggle'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { useNotificationHub } from '@/features/notifications/hooks/useNotificationHub'
import { useChatUnreadSync } from '@/features/chat'
import { exerciseTrackingKeys } from '@/features/exercise-tracking'
import { useMyCoach } from '@/features/coach-client'
import { useMyPreferences, useUpdatePreferences } from '@/features/profile'

const MINI_WIDTH  = 56
const FULL_WIDTH  = 220

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
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
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const weightUnit = usePreferenceStore((s) => s.weightUnit)
  const setWeightUnit = usePreferenceStore((s) => s.setWeightUnit)
  const { data: preferences } = useMyPreferences(!!user)
  const updatePreferences = useUpdatePreferences()
  const changePasswordLabel = (tn as typeof tn & { changePassword?: string }).changePassword ?? 'Change password'
  const exerciseLibraryLabel = (tn as typeof tn & { exerciseLibrary?: string }).exerciseLibrary ?? 'Exercise Library'
  const isWeekDetailPage = /^\/plans\/[^/]+\/weeks\/[^/]+$/.test(location.pathname)
  const isWidePage = isWeekDetailPage || location.pathname === '/insights'

  useNotificationHub()
  useChatUnreadSync()
  const { data: myCoach } = useMyCoach(isIndividual)
  const hasChatSidebar = isCoach && location.pathname === '/coach/clients'

  useEffect(() => {
    if (!preferences) return
    setLang(preferences.language)
    setTheme(preferences.theme)
    setWeightUnit(preferences.weightUnit)
  }, [preferences, setLang, setTheme, setWeightUnit])

  function savePreferences(next: Partial<{ language: Lang; theme: Theme; weightUnit: WeightUnit }>) {
    const language = next.language ?? lang
    const nextTheme = next.theme ?? theme
    const nextWeightUnit = next.weightUnit ?? weightUnit

    setLang(language)
    setTheme(nextTheme)
    setWeightUnit(nextWeightUnit)
    updatePreferences.mutate({ language, theme: nextTheme, weightUnit: nextWeightUnit })
  }

  const individualNav = [
    { to: '/dashboard',         icon: LayoutDashboard,   label: tn.dashboard,         color: '#6366f1' },
    { to: '/plans',             icon: ClipboardList,     label: tn.myPlans,           color: '#f97316' },
    { to: '/exercise-library',  icon: BookOpen,          label: exerciseLibraryLabel,  color: '#06b6d4' },
    { to: '/progress',          icon: TrendingUp,        label: tn.progress,          color: '#f59e0b' },
    { to: '/nutrition',         icon: Utensils,          label: 'Nutrition',          color: '#ec4899' },
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
    { to: '/coach/clients',   icon: UserCheck,         label: tn.clients,          color: '#8b5cf6' },
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

  // Individual users see Coach nav items as locked teasers — clicking navigates to the subscription page.
  const lockedCoachNavItems: LockedNavItem[] = isIndividual
    ? [{ icon: UserCheck, label: tn.clients, to: '/subscription?reason=coach-required' }]
    : []

  function handleLogout() {
    setUserMenuOpen(false)
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
            <LanguageSwitcher variant="text" onChange={(language) => savePreferences({ language })} />
            <ThemeToggle onChange={(nextTheme) => savePreferences({ theme: nextTheme })} />
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="xn-topbar-button flex items-center gap-2 rounded-full px-2 py-1"
                style={{ cursor: 'pointer' }}
              >
                <UserAvatar name={user?.fullName} email={user?.email} imageUrl={user?.avatarUrl} size={28} />
                <span className="hidden md:block text-sm font-medium max-w-[120px] truncate" style={{ color: 'var(--fg-on-clay)' }}>
                  {user?.fullName ?? user?.email}
                </span>
                <ChevronDown size={13} style={{ color: 'var(--fg-on-clay)', transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
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
                      className="xn-card absolute right-0 top-full z-20 mt-2 w-64"
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
                        <NavLink
                          to="/settings/blocklist"
                          onClick={() => setUserMenuOpen(false)}
                          className="xn-nav-item"
                          style={{ fontSize: 13 }}
                        >
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
                              onChange={(language) => savePreferences({ language })}
                            />
                          </PreferenceRow>
                          <PreferenceRow label="Theme">
                            <SegmentedPreference
                              value={theme}
                              options={[
                                { value: 'light', label: 'Light' },
                                { value: 'dark', label: 'Dark' },
                              ]}
                              onChange={(nextTheme) => savePreferences({ theme: nextTheme })}
                            />
                          </PreferenceRow>
                          <PreferenceRow label="Weight">
                            <SegmentedPreference
                              value={weightUnit}
                              options={[
                                { value: 'kg', label: 'kg' },
                                { value: 'lb', label: 'lb' },
                              ]}
                              onChange={(nextWeightUnit) => savePreferences({ weightUnit: nextWeightUnit })}
                            />
                          </PreferenceRow>
                        </div>
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
        <main
          className="flex-1 overflow-y-auto"
          style={hasChatSidebar ? { paddingRight: 'calc(22rem + 16px)' } : undefined}
        >
          <div className={cn('xn-page-container', isWidePage && 'wide')}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={shouldReduce ? false : { opacity: 0, y: 10, filter: 'blur(2px)' }}
                animate={shouldReduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={shouldReduce ? { opacity: 1 } : { opacity: 0, y: -6, filter: 'blur(2px)' }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
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
              minWidth: 36,
              padding: '4px 8px',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              background: active ? 'var(--bg-2)' : 'transparent',
              color: active ? 'var(--fg-1)' : 'var(--fg-3)',
              boxShadow: active ? 'var(--sh-xs)' : 'none',
              transition: 'all 140ms',
            }}
          >
            {option.label}
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
  hideBrand?: boolean
}

function SidebarInner({
  navItems, lockedNavItems = [], user, isCoach, isAdmin, mini, onToggleMini, onLogout, onNavClick, hideBrand,
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
          <span className="xn-nav-section">{isAdmin ? 'Admin' : isCoach ? tn.sectionCoach : tn.sectionTraining}</span>
        )}
        {navItems.map(({ to, icon: Icon, label, color }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
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
                <Icon size={17} style={color ? { color } : undefined} />
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
            <Icon size={17} />
            {!mini && (
              <>
                <span className="xn-nav-item-label" style={{ flex: 1 }}>{label}</span>
                <Lock className="xn-nav-lock" size={12} style={{ color: 'var(--fg-4)', flexShrink: 0 }} />
              </>
            )}
          </RouterLink>
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
