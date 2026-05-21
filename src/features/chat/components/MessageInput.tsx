import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/shared/components/Button'

interface Props {
  onSend: (content: string) => void
  isPending: boolean
}

export function MessageInput({ onSend, isPending }: Props) {
  const [value, setValue] = useState('')

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || isPending) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <div
      className="flex items-end gap-2 border-t p-3"
      style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nhập tin nhắn... (Enter để gửi)"
        rows={1}
        className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none"
        style={{
          background: 'var(--bg-3)',
          color: 'var(--fg-1)',
          maxHeight: '120px',
          overflowY: 'auto',
        }}
      />
      <Button size="sm" onClick={submit} loading={isPending} disabled={!value.trim()}>
        <Send size={14} />
      </Button>
    </div>
  )
}
