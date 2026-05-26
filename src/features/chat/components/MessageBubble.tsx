import { format } from 'date-fns'
import { cn } from '@/shared/utils/cn'
import type { MessageResponse } from '../types'

interface Props {
  message: MessageResponse
  isMine: boolean
}

export function MessageBubble({ message, isMine }: Props) {
  if (message.kind === 'System') {
    return (
      <div className="flex justify-center">
        <div
          className="max-w-[86%] rounded-full px-3 py-1.5 text-center text-xs"
          style={{ background: 'var(--bg-3)', color: 'var(--fg-3)' }}
        >
          <span className="whitespace-pre-wrap break-words">{message.content}</span>
          <span className="ml-2 opacity-60">{format(new Date(message.createdAt), 'HH:mm')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
          isMine ? 'rounded-br-sm' : 'rounded-bl-sm',
        )}
        style={
          isMine
            ? { background: 'var(--color-primary)', color: '#fff' }
            : { background: 'var(--bg-3)', color: 'var(--fg-1)' }
        }
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn('mt-1 text-right text-[10px]', isMine ? 'opacity-70' : 'opacity-50')}
        >
          {format(new Date(message.createdAt), 'HH:mm')}
        </p>
      </div>
    </div>
  )
}
