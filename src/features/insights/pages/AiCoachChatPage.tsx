import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronLeft, Send, Sparkles } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { CycleAwareBadge } from '@/shared/components/CycleAwareBadge'
import { cn } from '@/shared/utils/cn'
import { useLangStore } from '@/shared/i18n'
import { useMyProfile } from '@/features/profile'
import { RequireTier } from '@/features/billing/components/RequireTier'
import { useCoachChat } from '../api/useUserAnalysis'
import type { CoachChatMessage } from '../types'

// Render inline **bold** segments.
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
      : <span key={`${keyPrefix}-${i}`}>{part}</span>,
  )
}

// Lightweight markdown for the AI's output: headings (#), bullets (-/*), bold, paragraphs.
function Markdown({ content }: { content: string }) {
  const blocks: ReactNode[] = []
  let list: string[] = []
  let key = 0

  const flushList = () => {
    if (list.length === 0) return
    const items = list
    blocks.push(
      <ul key={`ul-${key++}`} className="my-1 list-disc space-y-1 pl-5">
        {items.map((item, i) => <li key={i}>{renderInline(item, `li-${key}-${i}`)}</li>)}
      </ul>,
    )
    list = []
  }

  for (const raw of content.split('\n')) {
    const line = raw.trimEnd()
    if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ''))
      continue
    }
    flushList()
    if (line.trim() === '') continue
    const heading = line.match(/^#{1,6}\s+(.*)$/)
    if (heading) {
      blocks.push(
        <p key={`h-${key++}`} className="mt-3 mb-1 font-bold text-text first:mt-0">
          {renderInline(heading[1], `h-${key}`)}
        </p>,
      )
      continue
    }
    blocks.push(<p key={`p-${key++}`} className="leading-6">{renderInline(line, `p-${key}`)}</p>)
  }
  flushList()

  return <div className="space-y-1.5">{blocks}</div>
}

export function AiCoachChatPage() {
  const lang = useLangStore((s) => s.lang)
  const tx = chatText(lang)
  const { data: profile } = useMyProfile()
  const isFemale = profile?.gender === 'Female'
  const suggestions = isFemale ? [...tx.suggestions, ...tx.cycleSuggestions] : tx.suggestions
  const [messages, setMessages] = useState<CoachChatMessage[]>([])
  const [input, setInput] = useState('')
  const { mutate: sendChat, isPending, error } = useCoachChat()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isPending])

  const apiError = (error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message

  function send(text: string) {
    const content = text.trim()
    if (!content || isPending) return
    const next: CoachChatMessage[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    sendChat(next, {
      onSuccess: (res) => setMessages((m) => [...m, { role: 'assistant', content: res.reply }]),
    })
  }

  return (
    <RequireTier feature="Analyze">
    <div className="flex h-[calc(100vh-7rem)] w-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link to="/insights">
          <Button variant="ghost" size="sm"><ChevronLeft size={16} /></Button>
        </Link>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          <Sparkles size={18} />
        </span>
        <div>
          <h1 className="text-lg font-bold leading-tight text-text">{tx.title}</h1>
          <p className="text-xs text-muted">{tx.subtitle}</p>
        </div>
        <CycleAwareBadge className="ml-1" />
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto rounded-2xl p-4"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Sparkles size={30} style={{ color: 'var(--accent)' }} />
            <p className="max-w-sm text-sm text-muted">{tx.empty}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border px-3 py-1.5 text-xs text-text transition-colors hover:bg-[var(--bg-3)]"
                  style={{ borderColor: 'var(--border-1)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-6"
                  style={
                    m.role === 'user'
                      ? { background: 'var(--color-primary)', color: '#fff' }
                      : { background: 'var(--bg-1)', color: 'var(--fg-1)', border: '1px solid var(--border-1)' }
                  }
                >
                  {m.role === 'assistant'
                    ? <Markdown content={m.content} />
                    : <span className="whitespace-pre-wrap">{m.content}</span>}
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-3.5 py-2.5 text-sm text-muted"
                  style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)' }}
                >
                  {tx.thinking}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {apiError && (
        <p className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--xn-danger-bg)', color: 'var(--xn-danger)' }}>
          {apiError}
        </p>
      )}

      {/* Composer */}
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => { e.preventDefault(); send(input) }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          rows={1}
          placeholder={tx.placeholder}
          className="max-h-40 min-h-[44px] flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm text-text outline-none"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
        />
        <Button type="submit" disabled={!input.trim()} loading={isPending}>
          <Send size={16} />
        </Button>
      </form>
    </div>
    </RequireTier>
  )
}

function chatText(lang: 'en' | 'vi') {
  return lang === 'vi'
    ? {
      title: 'AI Coach',
      subtitle: 'Trò chuyện về dữ liệu tập luyện của bạn',
      empty: 'Hỏi AI Coach bất cứ điều gì về kế hoạch, tiến độ, dinh dưỡng hay phục hồi của bạn.',
      thinking: 'Đang suy nghĩ…',
      placeholder: 'Nhắn cho AI Coach…',
      suggestions: [
        'Tuần này tôi nên tập trung vào điều gì?',
        'Tiến độ của tôi thế nào?',
        'Tôi có nên tăng tạ không?',
      ],
      cycleSuggestions: [
        'Tôi nên tập thế nào trong những ngày "đèn đỏ"?',
        'Vì sao tuần này tôi thấy ít năng lượng?',
        'Thời điểm nào trong chu kỳ tôi nên đẩy PR?',
      ],
    }
    : {
      title: 'AI Coach',
      subtitle: 'Chat about your training data',
      empty: 'Ask your AI Coach anything about your plan, progress, nutrition, or recovery.',
      thinking: 'Thinking…',
      placeholder: 'Message your AI Coach…',
      suggestions: [
        'What should I focus on this week?',
        'How is my progress?',
        'Should I add weight?',
      ],
      cycleSuggestions: [
        'How should I train during my period?',
        'Why is my energy low this week?',
        'When in my cycle should I push for PRs?',
      ],
    }
}
