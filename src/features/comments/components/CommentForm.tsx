import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send } from 'lucide-react'

const schema = z.object({
  content: z.string().min(1, 'Vui lòng nhập nội dung').max(1000, 'Tối đa 1000 ký tự'),
})
type FormValues = z.infer<typeof schema>

interface Props {
  onSubmit: (content: string) => Promise<unknown>
  isPending: boolean
}

export function CommentForm({ onSubmit, isPending }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function submit(data: FormValues) {
    await onSubmit(data.content)
    reset()
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-2">
      <div className="flex gap-2 items-end">
        <textarea
          {...register('content')}
          placeholder="Viết bình luận..."
          rows={2}
          className="flex-1 resize-none rounded-lg text-sm transition-colors"
          style={{
            background: 'var(--bg-3)',
            border: '1px solid var(--border-1)',
            color: 'var(--fg-1)',
            padding: '8px 12px',
            outline: 'none',
            lineHeight: 1.5,
          }}
          onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)' }}
          onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-1)' }}
        />
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center rounded-lg transition-opacity"
          style={{
            width: 36, height: 36, flexShrink: 0,
            background: 'var(--color-primary)',
            border: 'none', cursor: isPending ? 'not-allowed' : 'pointer',
            color: '#fff', opacity: isPending ? 0.6 : 1,
          }}
        >
          <Send size={15} />
        </button>
      </div>
      {errors.content && (
        <p className="text-xs" style={{ color: 'var(--color-danger)', margin: '4px 0 0' }}>
          {errors.content.message}
        </p>
      )}
    </form>
  )
}
