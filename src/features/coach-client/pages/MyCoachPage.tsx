import { Link, useNavigate } from 'react-router'
import { CalendarDays, CheckCircle2, KeyRound, MessageCircle, UserCheck, UserMinus, XCircle } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { Button } from '@/shared/components/Button'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { useConfirm } from '@/shared/components/ConfirmModal'
import { useAuthStore } from '@/features/auth'
import { ChatPanel } from '@/features/chat/components/ChatPanel'
import { useMyCoach, useAcceptTermination, useRequestTermination, useRejectTermination } from '../api/useCoachClient'

const chatStatuses = new Set(['Active', 'PendingTermination', 'PendingRenewal'])

function formatDate(value: string | null | undefined) {
  if (!value) return 'Open'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    Pending: 'Pending',
    Active: 'Active',
    Ended: 'Ended',
    PendingTermination: 'Pending termination',
    Expired: 'Expired',
    PendingRenewal: 'Pending renewal',
  }
  return labels[status] ?? status
}

export function MyCoachPage() {
  const navigate = useNavigate()
  const myId = useAuthStore((s) => s.user?.id ?? '')
  const { data: relationship, isLoading } = useMyCoach()
  const acceptTermination = useAcceptTermination()
  const requestTermination = useRequestTermination()
  const rejectTermination = useRejectTermination()
  const { confirm, ConfirmDialog } = useConfirm()
  const canChat = relationship ? chatStatuses.has(relationship.status) : false

  if (isLoading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!relationship) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--fg-1)' }}>Coach</h1>
        </div>
        <Card className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'var(--bg-3)', color: 'var(--color-primary)' }}>
              <KeyRound size={21} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--fg-1)' }}>No connected coach</p>
              <p className="text-sm" style={{ color: 'var(--fg-3)' }}>Enter an invite code from your coach to connect.</p>
            </div>
          </div>
          <Link to="/enter-coach-code" className="xn-btn primary" style={{ textDecoration: 'none' }}>
            <KeyRound size={16} />
            Enter coach code
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid min-h-[calc(100vh-8rem)] gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
      {ConfirmDialog}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--fg-1)' }}>Coach</h1>
        </div>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <UserAvatar name={relationship.coachName} size={48} variant="sage" />
            <div className="min-w-0">
              <p className="truncate font-semibold" style={{ color: 'var(--fg-1)' }}>{relationship.coachName}</p>
              <p className="text-sm" style={{ color: 'var(--fg-3)' }}>{formatStatus(relationship.status)}</p>
            </div>
          </div>

          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2" style={{ color: 'var(--fg-2)' }}>
              <CalendarDays size={15} />
              <span>{formatDate(relationship.startDate)} - {formatDate(relationship.endDate)}</span>
            </div>
            <div className="flex items-center gap-2" style={{ color: canChat ? 'var(--color-success)' : 'var(--fg-3)' }}>
              <UserCheck size={15} />
              <span>{canChat ? 'Connected' : 'Chat unavailable'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--fg-3)' }}>
            <MessageCircle size={15} />
            <span>Messages stay tied to this coaching relationship.</span>
          </div>

          {(() => {
            const status = relationship.status
            const isPendingTermination = status === 'PendingTermination'
            const iInitiated = isPendingTermination && relationship.terminationRequestedBy === myId
            const coachInitiated = isPendingTermination && relationship.terminationRequestedBy !== myId
            const canDisconnect = status === 'Active' || status === 'Expired' || status === 'PendingRenewal'
            const busy = requestTermination.isPending || acceptTermination.isPending || rejectTermination.isPending

            if (canDisconnect) {
              return (
                <Button
                  variant="danger"
                  className="w-full"
                  loading={requestTermination.isPending}
                  onClick={async () => {
                    const ok = await confirm(
                      'Disconnect from your coach? This will end the coaching relationship once they confirm.',
                      { confirmLabel: 'Disconnect', danger: true },
                    )
                    if (ok) requestTermination.mutate(relationship.id)
                  }}
                >
                  <UserMinus size={16} /> Disconnect from coach
                </Button>
              )
            }

            if (iInitiated) {
              return (
                <div className="flex flex-col gap-2">
                  <p className="text-sm" style={{ color: 'var(--fg-3)' }}>
                    Waiting for your coach to confirm the disconnect.
                  </p>
                  <Button
                    variant="secondary"
                    className="w-full"
                    loading={rejectTermination.isPending}
                    onClick={() => rejectTermination.mutate(relationship.id)}
                  >
                    <XCircle size={16} /> Cancel request
                  </Button>
                </div>
              )
            }

            if (coachInitiated) {
              return (
                <div className="flex flex-col gap-2">
                  <p className="text-sm" style={{ color: 'var(--fg-3)' }}>
                    Your coach requested to disconnect.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="success"
                      className="flex-1"
                      loading={acceptTermination.isPending}
                      disabled={busy}
                      onClick={() => acceptTermination.mutate(relationship.id)}
                    >
                      <CheckCircle2 size={16} /> Accept
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-1"
                      loading={rejectTermination.isPending}
                      disabled={busy}
                      onClick={() => rejectTermination.mutate(relationship.id)}
                    >
                      <XCircle size={16} /> Reject
                    </Button>
                  </div>
                </div>
              )
            }

            return null
          })()}
        </Card>
      </div>

      {canChat ? (
        <div className="min-h-[34rem] overflow-hidden rounded-2xl">
          <ChatPanel
            relationshipId={relationship.id}
            otherPersonName={relationship.coachName}
            onClose={() => navigate('/dashboard')}
          />
        </div>
      ) : (
        <Card className="flex min-h-[24rem] items-center justify-center text-center">
          <div>
            <MessageCircle size={28} className="mx-auto mb-3" style={{ color: 'var(--fg-3)' }} />
            <p className="font-semibold" style={{ color: 'var(--fg-1)' }}>Chat is not available</p>
          </div>
        </Card>
      )}
    </div>
  )
}
