import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'
import { Mail, Lock, User, Check } from 'lucide-react'
import { Input } from '@/shared/components/Input'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { useT } from '@/shared/i18n'
import { useRegister } from '../index'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['Individual', 'Coach']),
})

type FormData = z.infer<typeof schema>

// Panel styling constants (colours only — copy driven by translations)
const PANEL_STYLE = {
  Individual: {
    badgeBg: 'var(--xn-clay-300)',
    badgeColor: 'var(--xn-clay-900)',
    checkBg: 'var(--xn-clay-700)',
    footerBg: 'rgba(163, 139, 118, 0.12)',
    panelGradient: 'linear-gradient(145deg, var(--xn-clay-200) 0%, var(--xn-clay-100) 60%, var(--xn-ink-100) 100%)',
  },
  Coach: {
    badgeBg: 'var(--xn-sage-300)',
    badgeColor: '#2e4018',
    checkBg: 'var(--xn-sage-600)',
    footerBg: 'rgba(140, 150, 101, 0.12)',
    panelGradient: 'linear-gradient(145deg, var(--xn-sage-200) 0%, var(--xn-sage-100) 60%, var(--xn-ink-100) 100%)',
  },
} as const

export function RegisterPage() {
  const navigate = useNavigate()
  const { mutate: register_, isPending, error } = useRegister()
  const t = useT()
  const tr = t.register

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'Individual' },
  })

  const selectedRole = watch('role')
  const style = PANEL_STYLE[selectedRole] ?? PANEL_STYLE.Individual
  const panel = tr.panel[selectedRole] ?? tr.panel.Individual

  function onSubmit(data: FormData) {
    register_(data, { onSuccess: () => navigate('/dashboard') })
  }

  const apiError = (error as AxiosError<ApiError>)?.response?.data?.message

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--xn-paper)' }}>

      {/* ── Left: form panel ───────────────────────────────────────────────── */}
      <div
        className="flex flex-col w-full md:w-1/2 md:border-r"
        style={{ borderColor: 'var(--border-1)', padding: 'clamp(28px, 4vw, 44px) clamp(24px, 5vw, 56px)' }}
      >
        {/* Top bar: brand + lang switcher */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/assets/logo-mark.svg" alt="Xenoh" width={28} height={28} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: '-0.01em',
              color: 'var(--xn-clay-700)',
            }}>
              Xenoh
            </span>
          </Link>
          <LanguageSwitcher variant="pill" />
        </div>

        {/* Form — vertically centred */}
        <div className="flex flex-1 items-center justify-center py-8">
          <div style={{ width: '100%', maxWidth: 390 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: '-0.02em',
              color: 'var(--fg-1)',
              margin: '0 0 6px',
            }}>
              {tr.title}
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-3)', margin: '0 0 22px', lineHeight: 1.55 }}>
              {tr.subtitle}
            </p>

            {/* ── Role toggle ── */}
            <div style={{
              display: 'flex',
              gap: 4,
              padding: 4,
              background: 'var(--bg-3)',
              borderRadius: 11,
              border: '1px solid var(--border-1)',
              marginBottom: 20,
            }}>
              {(['Individual', 'Coach'] as const).map((r) => (
                <label
                  key={r}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    fontWeight: selectedRole === r ? 600 : 500,
                    cursor: 'pointer',
                    background: selectedRole === r ? 'var(--bg-2)' : 'transparent',
                    color: selectedRole === r ? 'var(--fg-1)' : 'var(--fg-3)',
                    borderRadius: 8,
                    boxShadow: selectedRole === r ? 'var(--sh-xs)' : 'none',
                    transition: 'all 140ms',
                    userSelect: 'none' as const,
                  }}
                >
                  <input
                    type="radio"
                    value={r}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                    {...register('role')}
                  />
                  {r === 'Individual' ? tr.roleIndividual : tr.roleCoach}
                </label>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input
                  label={tr.firstNameLabel}
                  placeholder={tr.firstNamePlaceholder}
                  leftIcon={<User size={15} />}
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
                <Input
                  label={tr.lastNameLabel}
                  placeholder={tr.lastNamePlaceholder}
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />
              </div>

              <Input
                label={tr.emailLabel}
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail size={15} />}
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label={tr.passwordLabel}
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock size={15} />}
                error={errors.password?.message}
                {...register('password')}
              />

              {apiError && (
                <p style={{ fontSize: 13, color: 'var(--xn-danger)', margin: 0 }}>{apiError}</p>
              )}
              <AuthSubmitButton loading={isPending} label={tr.submit} />
            </form>

            <p style={{ marginTop: 22, fontSize: 13, color: 'var(--fg-3)', textAlign: 'center' }}>
              {tr.hasAccount}{' '}
              <Link to="/login" style={{ color: 'var(--xn-clay-700)', fontWeight: 600, textDecoration: 'none' }}>
                {tr.loginLink}
              </Link>
            </p>
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--fg-4)', textAlign: 'center' }}>{t.common.copyright}</p>
      </div>

      {/* ── Right: dynamic info panel ──────────────────────────────────────── */}
      <div
        className="hidden md:flex flex-col justify-center flex-1"
        style={{
          background: style.panelGradient,
          padding: '60px clamp(40px, 6vw, 72px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/assets/grain.svg)',
          backgroundSize: '320px',
          opacity: 0.07,
          pointerEvents: 'none',
        }} />

        {/* Role badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '5px 14px',
          borderRadius: 999,
          background: style.badgeBg,
          color: style.badgeColor,
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.07em',
          textTransform: 'uppercase' as const,
          marginBottom: 28,
          alignSelf: 'flex-start',
          position: 'relative',
        }}>
          {panel.badge}
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 'clamp(34px, 3.5vw, 44px)',
          lineHeight: 1.07,
          letterSpacing: '-0.025em',
          color: 'var(--xn-ink-900)',
          margin: '0 0 14px',
          maxWidth: 340,
          whiteSpace: 'pre-line',
          position: 'relative',
        }}>
          {panel.heading}
        </h2>

        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 15,
          color: 'var(--xn-ink-700)',
          margin: '0 0 32px',
          lineHeight: 1.65,
          maxWidth: 300,
          position: 'relative',
        }}>
          {panel.desc}
        </p>

        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 0 36px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          position: 'relative',
        }}>
          {panel.features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
              <span style={{
                marginTop: 2, flexShrink: 0,
                width: 17, height: 17, borderRadius: '50%',
                background: style.checkBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={9} color="white" strokeWidth={3} />
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--xn-ink-800)', lineHeight: 1.55 }}>
                {f}
              </span>
            </li>
          ))}
        </ul>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '10px 16px',
          background: style.footerBg,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.5)',
          alignSelf: 'flex-start',
          position: 'relative',
        }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--fg-2)' }}>
            {panel.footer}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Submit button ────────────────────────────────────────────────────────────
function AuthSubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        marginTop: 6,
        padding: '10px 0',
        background: 'var(--xn-clay-700)',
        color: 'var(--fg-on-clay)',
        border: 'none',
        borderRadius: 10,
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        fontSize: 14,
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: loading ? 0.65 : 1,
        transition: 'opacity 120ms',
        width: '100%',
        letterSpacing: '0.01em',
      }}
      onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--xn-clay-800)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--xn-clay-700)' }}
    >
      {loading && (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {label}
    </button>
  )
}
