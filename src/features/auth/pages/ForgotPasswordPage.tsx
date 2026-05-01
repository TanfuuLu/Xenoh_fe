import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'
import { KeyRound, Lock, Mail } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { useT } from '@/shared/i18n'
import { useResetPassword, useSendForgotPasswordCode } from '../index'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'

const copy = {
  title: 'Reset password',
  subtitle: 'Enter your email and we will send a short reset code.',
  codeTitle: 'Check your email',
  codeSubtitle: 'Enter the 6-digit code and choose a new password.',
  emailLabel: 'Email',
  codeLabel: 'Reset code',
  newPasswordLabel: 'New password',
  confirmPasswordLabel: 'Confirm password',
  sendCode: 'Send code',
  resetPassword: 'Reset password',
  backToLogin: 'Back to sign in',
  codeSent: 'If that email exists, a reset code has been sent.',
  resetSuccess: 'Password reset successfully. You can sign in now.',
  passwordMismatch: 'Passwords do not match',
  codeLength: 'Code must be 6 digits',
}

const emailSchema = z.object({
  email: z.string().email(),
})

const resetSchema = z.object({
  code: z.string().regex(/^\d{6}$/, copy.codeLength),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: copy.passwordMismatch,
  path: ['confirmPassword'],
})

type EmailForm = z.infer<typeof emailSchema>
type ResetForm = z.infer<typeof resetSchema>

export function ForgotPasswordPage() {
  const t = useT()
  const navigate = useNavigate()
  const tf = ((t as typeof t & { forgotPassword?: typeof copy }).forgotPassword ?? copy)
  const [email, setEmail] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const { mutate: sendCode, isPending: sending, error: sendError } = useSendForgotPasswordCode()
  const { mutate: resetPassword, isPending: resetting, error: resetError } = useResetPassword()

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  })

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  })

  function onSendCode(data: EmailForm) {
    sendCode(data, {
      onSuccess: () => {
        setEmail(data.email)
        setCodeSent(true)
      },
    })
  }

  function onReset(data: ResetForm) {
    resetPassword({
      email,
      code: data.code,
      newPassword: data.newPassword,
    }, {
      onSuccess: () => {
        resetForm.reset()
        navigate('/login', { replace: true })
      },
    })
  }

  const apiError = ((resetError ?? sendError) as AxiosError<ApiError> | undefined)?.response?.data?.message

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--xn-paper)' }}>
      <div
        className="flex w-full flex-col md:w-1/2 md:border-r"
        style={{ borderColor: 'var(--border-1)', padding: 'clamp(28px, 4vw, 44px) clamp(24px, 5vw, 56px)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/assets/logo-mark.svg" alt="Xenoh" width={28} height={28} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--xn-clay-700)' }}>
              Xenoh
            </span>
          </Link>
          <LanguageSwitcher variant="pill" />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div style={{ width: '100%', maxWidth: 380 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--fg-1)', margin: '0 0 6px' }}>
              {codeSent ? tf.codeTitle : tf.title}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--fg-3)', margin: '0 0 28px', lineHeight: 1.55 }}>
              {codeSent ? tf.codeSubtitle : tf.subtitle}
            </p>

            {!codeSent ? (
              <form onSubmit={emailForm.handleSubmit(onSendCode)} className="flex flex-col gap-3.5">
                <Input
                  label={tf.emailLabel}
                  type="email"
                  placeholder="you@example.com"
                  leftIcon={<Mail size={15} />}
                  error={emailForm.formState.errors.email?.message}
                  {...emailForm.register('email')}
                />
                {apiError && <p className="text-sm text-danger">{apiError}</p>}
                <Button type="submit" loading={sending}>{tf.sendCode}</Button>
              </form>
            ) : (
              <form onSubmit={resetForm.handleSubmit(onReset)} className="flex flex-col gap-3.5">
                <p className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border-1)', color: 'var(--fg-2)', background: 'var(--bg-2)' }}>
                  {tf.codeSent}
                </p>
                <Input
                  label={tf.codeLabel}
                  inputMode="numeric"
                  maxLength={6}
                  leftIcon={<KeyRound size={15} />}
                  error={resetForm.formState.errors.code?.message}
                  {...resetForm.register('code')}
                />
                <Input
                  label={tf.newPasswordLabel}
                  type="password"
                  leftIcon={<Lock size={15} />}
                  error={resetForm.formState.errors.newPassword?.message}
                  {...resetForm.register('newPassword')}
                />
                <Input
                  label={tf.confirmPasswordLabel}
                  type="password"
                  leftIcon={<Lock size={15} />}
                  error={resetForm.formState.errors.confirmPassword?.message}
                  {...resetForm.register('confirmPassword')}
                />
                {apiError && <p className="text-sm text-danger">{apiError}</p>}
                <Button type="submit" loading={resetting}>{tf.resetPassword}</Button>
              </form>
            )}

            <p className="mt-5 text-center text-sm text-muted">
              <Link to="/login" style={{ color: 'var(--xn-clay-700)', fontWeight: 600, textDecoration: 'none' }}>
                {tf.backToLogin}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div
        className="hidden flex-1 flex-col justify-center md:flex"
        style={{
          background: 'linear-gradient(145deg, var(--bg-4) 0%, var(--xn-clay-200) 58%, var(--bg-3) 100%)',
          padding: '60px clamp(40px, 6vw, 72px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/assets/grain.svg)', backgroundSize: '320px', opacity: 0.07 }} />
        <img src="/assets/logo-mark.svg" alt="" style={{ width: 52, height: 52, marginBottom: 36, opacity: 0.3, position: 'relative' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(36px, 4vw, 48px)', lineHeight: 1.08, color: 'var(--xn-ink-900)', margin: 0, maxWidth: 380, position: 'relative' }}>
          One code. Back to the plan.
        </h2>
      </div>
    </div>
  )
}
