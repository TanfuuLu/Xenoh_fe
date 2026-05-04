import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Spinner } from '@/shared/components/Spinner'
import { exchangeExternalLoginTicketOnce } from '../index'

export function SocialCallbackPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const ticket = params.get('ticket')
  const [exchangeStarted, setExchangeStarted] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (exchangeStarted) return

    if (!ticket) {
      navigate('/login?externalError=Missing external login ticket.', { replace: true })
      return
    }

    setExchangeStarted(true)
    exchangeExternalLoginTicketOnce({ ticket })
      .then(() => {
          queryClient.clear()
          navigate('/dashboard', { replace: true })
      })
      .catch(() => {
        setHasError(true)
        navigate('/login?externalError=External login expired. Please try again.', { replace: true })
      })
  }, [exchangeStarted, navigate, queryClient, ticket])

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--xn-paper)' }}>
      <div
        className="text-center"
        style={{
          width: 'min(92vw, 380px)',
          border: '1px solid var(--border-1)',
          borderRadius: 18,
          padding: 28,
          background: 'var(--bg-2)',
          boxShadow: 'var(--sh-md)',
        }}
      >
        <img src="/assets/logo-mark.svg" alt="Xenoh" width={42} height={42} style={{ margin: '0 auto 18px' }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, margin: '0 0 8px', color: 'var(--fg-1)' }}>
          Signing you in
        </h1>
        <p style={{ color: 'var(--fg-3)', fontSize: 14, margin: '0 0 18px' }}>
          We are connecting your account securely.
        </p>
        {!hasError && <Spinner size="md" />}
        {hasError && (
          <Link to="/login" style={{ color: 'var(--xn-clay-700)', fontWeight: 600, textDecoration: 'none' }}>
            Back to sign in
          </Link>
        )}
      </div>
    </div>
  )
}
