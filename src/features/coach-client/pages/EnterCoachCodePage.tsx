import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { KeyRound } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { motionProps } from '@/shared/utils/motion'
import { useConnectByCode, useMyCoach } from '../api/useCoachClient'
import { useAuthStore } from '@/features/auth'
import { useT } from '@/shared/i18n'

export function EnterCoachCodePage() {
  const navigate = useNavigate()
  const connect = useConnectByCode()
  const isIndividual = useAuthStore((s) => !s.user?.roles?.includes('Coach') && !s.user?.roles?.includes('Admin'))
  const { data: myCoach } = useMyCoach(isIndividual)
  const tx = useT().enterCoachCode
  const schema = z.object({
    code: z
      .string()
      .min(1, tx.errorRequired)
      .length(8, tx.errorLength)
      .transform((v) => v.toUpperCase()),
  })
  type FormData = z.output<typeof schema>

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await connect.mutateAsync({ code: data.code })
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        tx.errorInvalid
      setError('code', { message: msg })
    }
  }

  if (myCoach) return <Navigate to="/coaches" replace />

  return (
    <motion.div {...motionProps.slideUp} className="mx-auto max-w-md space-y-6 py-8">
      <div className="text-center">
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'var(--bg-3)' }}
        >
          <KeyRound size={32} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--fg-1)' }}>
          {tx.title}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--fg-3)' }}>
          {tx.subtitle}
        </p>
      </div>

      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-3)' }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={tx.label}
            placeholder={tx.placeholder}
            {...register('code', {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                e.target.value = e.target.value.toUpperCase()
              },
            })}
            error={errors.code?.message}
            className="font-mono text-lg tracking-widest text-center"
            maxLength={8}
          />
          <Button type="submit" loading={connect.isPending} className="w-full">
            <KeyRound size={16} />
            {tx.submit}
          </Button>
        </form>
      </div>

      <p className="text-center text-xs" style={{ color: 'var(--fg-3)' }}>
        {tx.noCode}
      </p>
    </motion.div>
  )
}
