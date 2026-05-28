import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Input } from '@/shared/components/Input'
import { useT } from '@/shared/i18n'
import { useChangePassword } from '@/features/auth'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'

type PasswordForm = {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export function ChangePasswordPage() {
  const t = useT()
  const tp = t.profile
  const { mutate: changePassword, isPending, error } = useChangePassword()
  const [success, setSuccess] = useState(false)

  const copy = {
    eyebrow: (tp as typeof tp & { securitySection?: string }).securitySection ?? 'Security',
    title: (tp as typeof tp & { changePasswordTitle?: string }).changePasswordTitle ?? 'Change password',
    subtitle: 'Confirm your current password before setting a new one.',
    currentPassword: (tp as typeof tp & { currentPasswordLabel?: string }).currentPasswordLabel ?? 'Current password',
    newPassword: (tp as typeof tp & { newPasswordLabel?: string }).newPasswordLabel ?? 'New password',
    confirmPassword: (tp as typeof tp & { confirmPasswordLabel?: string }).confirmPasswordLabel ?? 'Confirm new password',
    submit: (tp as typeof tp & { changePasswordBtn?: string }).changePasswordBtn ?? 'Update password',
    success: (tp as typeof tp & { changePasswordSuccess?: string }).changePasswordSuccess ?? 'Password updated successfully.',
    mismatch: (tp as typeof tp & { passwordMismatch?: string }).passwordMismatch ?? 'Passwords do not match',
  }

  const passwordSchema = z.object({
    oldPassword: z.string().min(6),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: copy.mismatch,
    path: ['confirmPassword'],
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof passwordSchema>, unknown, PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  function onSubmit(data: PasswordForm) {
    setSuccess(false)
    changePassword({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    }, {
      onSuccess: () => {
        reset()
        setSuccess(true)
      },
    })
  }

  const apiError = (error as AxiosError<ApiError>)?.response?.data?.message

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full border"
          style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)', color: 'var(--xn-clay-700)' }}
        >
          <ShieldCheck size={21} />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{copy.eyebrow}</p>
          <h1 className="text-2xl font-bold text-text">{copy.title}</h1>
          <p className="mt-1 text-sm text-muted">{copy.subtitle}</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={copy.currentPassword}
            type="password"
            leftIcon={<LockKeyhole size={15} />}
            error={errors.oldPassword?.message}
            {...register('oldPassword')}
          />
          <Input
            label={copy.newPassword}
            type="password"
            leftIcon={<LockKeyhole size={15} />}
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Input
            label={copy.confirmPassword}
            type="password"
            leftIcon={<LockKeyhole size={15} />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {apiError && <p className="text-sm text-danger">{apiError}</p>}
          {success && <p className="text-sm text-success">{copy.success}</p>}

          <Button type="submit" loading={isPending} className="w-full sm:w-auto">
            {copy.submit}
          </Button>
        </form>
      </Card>
    </div>
  )
}
