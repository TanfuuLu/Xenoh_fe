import { startExternalLogin } from '../api/useAuth'
import type { ExternalLoginProvider } from '../types'

const providers: Array<{
  id: ExternalLoginProvider
  label: string
  mark: string
}> = [
  { id: 'google', label: 'Continue with Google', mark: 'G' },
  { id: 'facebook', label: 'Continue with Facebook', mark: 'f' },
]

export function SocialLoginButtons() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {providers.map((provider) => (
        <button
          key={provider.id}
          type="button"
          onClick={() => startExternalLogin(provider.id)}
          style={{
            width: '100%',
            border: '1px solid var(--border-1)',
            borderRadius: 10,
            background: 'var(--bg-2)',
            color: 'var(--fg-1)',
            padding: '10px 12px',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: 'var(--sh-xs)',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: provider.id === 'google' ? '#fff' : '#1877f2',
              color: provider.id === 'google' ? '#4285f4' : '#fff',
              border: provider.id === 'google' ? '1px solid var(--border-1)' : 'none',
              fontWeight: 800,
              fontFamily: 'Georgia, serif',
            }}
          >
            {provider.mark}
          </span>
          {provider.label}
        </button>
      ))}
    </div>
  )
}

export function AuthDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
      <span style={{ height: 1, flex: 1, background: 'var(--border-1)' }} />
      <span style={{ color: 'var(--fg-4)', fontSize: 12, fontWeight: 600 }}>or</span>
      <span style={{ height: 1, flex: 1, background: 'var(--border-1)' }} />
    </div>
  )
}
