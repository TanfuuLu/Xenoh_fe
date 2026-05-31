import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Mail, Lock, Check } from 'lucide-react'
import { Input } from '@/shared/components/Input'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { useT } from '@/shared/i18n'
import { useLogin } from '../index'
import { AuthDivider, SocialLoginButtons } from '../components/SocialLoginButtons'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { mutate: login, isPending, error } = useLogin()
  const t = useT()
  const tl = t.login

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function onSubmit(data: FormData) {
    login(data, { onSuccess: () => navigate('/dashboard') })
  }

  const apiError = (error as AxiosError<ApiError>)?.response?.data?.message
  const externalError = searchParams.get('externalError')
  const registered = searchParams.get('registered') === '1'

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
        <div className="flex flex-1 items-center justify-center py-10">
          <div style={{ width: '100%', maxWidth: 360 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: '-0.02em',
              color: 'var(--fg-1)',
              margin: '0 0 6px',
            }}>
              {tl.title}
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-3)', margin: '0 0 28px', lineHeight: 1.55 }}>
              {tl.subtitle}
            </p>

            <SocialLoginButtons />
            <AuthDivider />

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input
                label={tl.emailLabel}
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail size={15} />}
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label={tl.passwordLabel}
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock size={15} />}
                error={errors.password?.message}
                {...register('password')}
              />
              <div style={{ textAlign: 'right', marginTop: -4 }}>
                <Link
                  to="/forgot-password"
                  style={{ color: 'var(--xn-clay-700)', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
                >
                  {(tl as typeof tl & { forgotPasswordLink?: string }).forgotPasswordLink ?? 'Forgot password?'}
                </Link>
              </div>
              {registered && (
                <p style={{ fontSize: 13, color: 'var(--color-success)', margin: 0 }}>
                  Registration successful. Please sign in.
                </p>
              )}
              {(apiError || externalError) && (
                <p style={{ fontSize: 13, color: 'var(--xn-danger)', margin: 0 }}>{apiError ?? externalError}</p>
              )}
              <AuthSubmitButton loading={isPending} label={tl.submit} />
            </form>

            <p style={{ marginTop: 22, fontSize: 13, color: 'var(--fg-3)', textAlign: 'center' }}>
              {tl.noAccount}{' '}
              <Link to="/register" style={{ color: 'var(--xn-clay-700)', fontWeight: 600, textDecoration: 'none' }}>
                {tl.registerLink}
              </Link>
            </p>
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--fg-4)', textAlign: 'center' }}>{t.common.copyright}</p>
      </div>

      {/* ── Right: info panel ─────────────────────────────────────────────── */}
      <div
        className="hidden md:flex flex-col justify-center flex-1"
        style={{
          background: 'linear-gradient(145deg, var(--bg-4) 0%, var(--xn-clay-200) 58%, var(--bg-3) 100%)',
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

        <img
          src="/assets/logo-mark.svg"
          alt=""
          style={{ width: 52, height: 52, marginBottom: 36, opacity: 0.3, position: 'relative' }}
        />

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 'clamp(36px, 4vw, 48px)',
          lineHeight: 1.06,
          letterSpacing: '-0.025em',
          color: 'var(--xn-ink-900)',
          margin: '0 0 14px',
          maxWidth: 380,
          whiteSpace: 'pre-line',
          position: 'relative',
        }}>
          {tl.panelHeading}
        </h2>

        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 15,
          color: 'var(--xn-ink-700)',
          margin: '0 0 36px',
          lineHeight: 1.65,
          maxWidth: 320,
          position: 'relative',
        }}>
          {tl.panelDesc}
        </p>

        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 0 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 13,
          position: 'relative',
        }}>
          {tl.panelFeatures.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
              <span style={{
                marginTop: 2, flexShrink: 0,
                width: 17, height: 17, borderRadius: '50%',
                background: 'var(--xn-clay-700)',
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

        <blockquote style={{ margin: 0, borderLeft: '2px solid var(--xn-clay-400)', paddingLeft: 18, position: 'relative' }}>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 16,
            color: 'var(--xn-ink-700)',
            margin: '0 0 6px',
            lineHeight: 1.5,
          }}>
            {tl.panelQuote}
          </p>
          <cite style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--fg-3)', fontStyle: 'normal' }}>
            {tl.panelQuoteAuthor}
          </cite>
        </blockquote>
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
