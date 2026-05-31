import { useForm, Controller } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'
import { Mail, Lock, User, Check, CheckCircle2, XCircle } from 'lucide-react'
import { Input } from '@/shared/components/Input'
import { DatePicker } from '@/shared/components/DatePicker'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { Select } from '@/shared/components/Select'
import { useT } from '@/shared/i18n'
import { useRegister } from '../index'
import { AuthDivider, SocialLoginButtons } from '../components/SocialLoginButtons'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'

const optionalNumber = z.preprocess(
  (v) => (v === '' || v == null ? undefined : Number(v)),
  z.number().positive().optional(),
)

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'One uppercase letter')
    .regex(/[a-z]/, 'One lowercase letter')
    .regex(/[0-9]/, 'One digit')
    .regex(/[^A-Za-z0-9]/, 'One special character'),
  gender: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.enum(['Male', 'Female'], { message: 'Gender is required' }),
  ),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  height: optionalNumber,
  bodyweight: optionalNumber,
})

type FormData = z.infer<typeof schema>

const PANEL_STYLE = {
  badgeBg: 'var(--xn-clay-300)',
  badgeColor: 'var(--xn-clay-900)',
  checkBg: 'var(--xn-clay-700)',
  footerBg: 'rgba(163, 139, 118, 0.12)',
  panelGradient: 'linear-gradient(145deg, var(--bg-4) 0%, var(--xn-clay-200) 58%, var(--bg-3) 100%)',
} as const

export function RegisterPage() {
  const navigate = useNavigate()
  const { mutate: register_, isPending, error } = useRegister()
  const t = useT()
  const tr = t.register

  const { register, handleSubmit, control, watch, formState: { errors, isSubmitted } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  })
  const passwordValue = watch('password') ?? ''

  const style = PANEL_STYLE
  const panel = tr.panel.Individual

  function onSubmit(data: FormData) {
    register_(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: 'Individual',
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        ...(data.height && { height: data.height }),
        ...(data.bodyweight && { bodyweight: data.bodyweight }),
      },
      {
        onSuccess: () => navigate('/login?registered=1', { replace: true }),
      },
    )
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

            <SocialLoginButtons />
            <AuthDivider />

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Gender"
                      options={[
                        { value: 'Male', label: 'Male' },
                        { value: 'Female', label: 'Female' },
                      ]}
                      placeholder="Select gender"
                      value={field.value ?? ''}
                      onChange={(value) => field.onChange(value || undefined)}
                      error={errors.gender?.message}
                    />
                  )}
                />
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Date of birth"
                      value={field.value ?? ''}
                      onChange={(value) => field.onChange(value)}
                      error={errors.dateOfBirth?.message}
                    />
                  )}
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
              <div>
                <Input
                  label={tr.passwordLabel}
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock size={15} />}
                  error={errors.password && isSubmitted ? ' ' : undefined}
                  {...register('password')}
                />
                <PasswordRules value={passwordValue} submitted={isSubmitted} />
              </div>

              {/* ── Body metrics (optional) ── */}
              <div style={{ borderTop: '1px solid var(--border-1)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--fg-4)', textTransform: 'uppercase', margin: 0 }}>
                  Body info <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional — helps personalize your plan)</span>
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Input
                    label="Height (cm)"
                    type="number"
                    placeholder="175"
                    {...register('height')}
                  />
                  <Input
                    label="Bodyweight (kg)"
                    type="number"
                    placeholder="70"
                    {...register('bodyweight')}
                  />
                </div>
              </div>

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

// ─── Password requirements checklist ─────────────────────────────────────────

const PASSWORD_RULES = [
  { label: 'At least 8 characters',       test: (v: string) => v.length >= 8 },
  { label: 'One uppercase letter (A–Z)',   test: (v: string) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter (a–z)',   test: (v: string) => /[a-z]/.test(v) },
  { label: 'One digit (0–9)',              test: (v: string) => /[0-9]/.test(v) },
  { label: 'One special character (!@#…)', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

function PasswordRules({ value, submitted }: { value: string; submitted: boolean }) {
  if (!value && !submitted) return null
  return (
    <div style={{
      marginTop: 8,
      padding: '10px 12px',
      borderRadius: 10,
      background: 'var(--bg-3)',
      border: '1px solid var(--border-1)',
      display: 'flex',
      flexDirection: 'column',
      gap: 7,
    }}>
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value)
        return (
          <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {met
              ? <CheckCircle2 size={15} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              : <XCircle size={15} style={{ color: submitted ? 'var(--color-danger)' : 'var(--color-muted)', flexShrink: 0 }} />
            }
            <span style={{
              fontSize: 13,
              fontWeight: met ? 500 : 400,
              color: met ? 'var(--color-success)' : submitted ? 'var(--color-danger)' : 'var(--fg-3)',
              transition: 'color 150ms',
            }}>
              {rule.label}
            </span>
          </div>
        )
      })}
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
        background: 'var(--button-bg)',
        color: 'var(--button-text)',
        border: '1px solid var(--button-border)',
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
      onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--button-hover)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--button-bg)' }}
    >
      {loading && (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {label}
    </button>
  )
}
