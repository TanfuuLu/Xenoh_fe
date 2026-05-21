import { createPortal } from 'react-dom'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Copy, Check, X } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/shared/components/Button'
import { DateRangePicker } from '@/shared/components/DateRangePicker'
import { useGenerateInviteCode } from '../api/useCoachClient'
import type { CoachInviteCodeResponse } from '../types'

const today = format(new Date(), 'yyyy-MM-dd')
const schema = z
  .object({
    coachingStartDate: z.string().min(1, 'Bắt buộc chọn ngày bắt đầu'),
    coachingEndDate: z.string().min(1, 'Bắt buộc chọn ngày kết thúc'),
  })
  .refine((d) => d.coachingEndDate > d.coachingStartDate, {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['coachingEndDate'],
  })

type FormData = z.infer<typeof schema>

interface Props {
  onClose: () => void
}

export function InviteCodeModal({ onClose }: Props) {
  const generateCode = useGenerateInviteCode()
  const [generated, setGenerated] = useState<CoachInviteCodeResponse | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { coachingStartDate: today },
  })

  const onSubmit = async (data: FormData) => {
    const result = await generateCode.mutateAsync(data)
    setGenerated(result)
  }

  const copyCode = async () => {
    if (!generated) return
    await navigator.clipboard.writeText(generated.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const content = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', zIndex: 9999 }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: 'var(--bg-2)', border: '2px solid var(--surface-border-soft)', boxShadow: 'var(--sh-md)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: 'var(--fg-1)' }}>
            {generated ? 'Mã Coach đã tạo' : 'Tạo mã Coach'}
          </h3>
          <button type="button" onClick={onClose} style={{ color: 'var(--fg-3)' }}>
            <X size={18} />
          </button>
        </div>

        {generated ? (
          <div className="flex flex-col gap-4 items-center">
            <p className="text-sm text-center" style={{ color: 'var(--fg-3)' }}>
              Chia sẻ mã này với client của bạn. Mã chỉ dùng được một lần.
            </p>
            <div
              className="flex items-center gap-3 rounded-xl px-5 py-4 font-mono text-2xl tracking-widest font-bold"
              style={{ background: 'var(--bg-3)', color: 'var(--fg-1)' }}
            >
              {generated.code}
              <button
                type="button"
                onClick={copyCode}
                className="ml-1"
                style={{ color: copied ? 'var(--color-success)' : 'var(--fg-3)' }}
                title="Sao chép mã"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--fg-3)' }}>
              Hiệu lực từ{' '}
              <strong>{format(new Date(generated.coachingStartDate), 'dd/MM/yyyy')}</strong>
              {' '}đến{' '}
              <strong>{format(new Date(generated.coachingEndDate), 'dd/MM/yyyy')}</strong>
            </p>
            <Button onClick={onClose} className="w-full">
              Đóng
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <DateRangePicker
              startValue={watch('coachingStartDate')}
              endValue={watch('coachingEndDate')}
              onStartChange={(val) => setValue('coachingStartDate', val, { shouldValidate: true })}
              onEndChange={(val) => setValue('coachingEndDate', val, { shouldValidate: true })}
              startLabel="Ngày bắt đầu coaching"
              endLabel="Ngày kết thúc coaching"
              startError={errors.coachingStartDate?.message}
              endError={errors.coachingEndDate?.message}
            />
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Hủy
              </Button>
              <Button type="submit" loading={generateCode.isPending} className="flex-1">
                Tạo mã
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
