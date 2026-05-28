import { useLangStore } from '@/shared/i18n'
import type { Lang } from '@/shared/i18n'

interface Props {
  /** 'pill' = rounded toggle chip (auth pages), 'text' = slim inline links (topbar/sidebar) */
  variant?: 'pill' | 'text'
  onChange?: (lang: Lang) => void
}

const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'vi', label: 'VI' },
]

export function LanguageSwitcher({ variant = 'text', onChange }: Props) {
  const { lang, setLang } = useLangStore()
  const selectLang = (value: Lang) => {
    setLang(value)
    onChange?.(value)
  }

  if (variant === 'pill') {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        padding: 3,
        background: 'var(--bg-3)',
        border: '1px solid var(--border-1)',
        borderRadius: 8,
      }}>
        {LANGS.map(({ value, label }) => (
          <button
            key={value}
            className="xn-segment-button"
            onClick={() => selectLang(value)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: lang === value ? 700 : 500,
              letterSpacing: '0.06em',
              background: lang === value ? 'var(--bg-2)' : 'transparent',
              color: lang === value ? 'var(--fg-1)' : 'var(--fg-3)',
              boxShadow: lang === value ? 'var(--sh-xs)' : 'none',
              transition: 'all 140ms',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    )
  }

  // 'text' variant — compact for sidebar / topbar
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {LANGS.map(({ value, label }, i) => (
        <span key={value} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          {i > 0 && (
            <span style={{ color: 'var(--fg-4)', fontSize: 11, userSelect: 'none' }}>·</span>
          )}
          <button
            className="xn-segment-button"
            onClick={() => selectLang(value)}
            style={{
              padding: '2px 5px',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: lang === value ? 700 : 500,
              letterSpacing: '0.07em',
              background: lang === value ? 'var(--xn-clay-200)' : 'transparent',
              color: lang === value ? 'var(--xn-clay-900)' : 'var(--fg-3)',
              transition: 'all 140ms',
            }}
          >
            {label}
          </button>
        </span>
      ))}
    </div>
  )
}
