import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { X, Calendar, TrendingUp, Dumbbell, ArrowRight } from 'lucide-react'
import { format, differenceInCalendarDays } from 'date-fns'
import { Button } from '@/shared/components/Button'
import type { ClientResponse, CoachClientDashboardResponse } from '../types'

interface Props {
  client: ClientResponse
  dashData?: CoachClientDashboardResponse
  barColor: string
  onClose: () => void
}

const ATTENTION_STYLE: Record<string, { label: string; color: string }> = {
  None:   { label: 'On track',   color: 'var(--color-success)' },
  Low:    { label: 'Low risk',   color: 'var(--color-warning)' },
  Medium: { label: 'Medium risk', color: '#f97316' },
  High:   { label: 'Needs attention', color: 'var(--color-danger)' },
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function formatDate(str: string) {
  return format(new Date(str + 'T00:00:00'), 'dd/MM/yyyy')
}

function lastWorkoutLabel(dashData: CoachClientDashboardResponse) {
  const days = dashData.daysSinceLastWorkout
  if (days === null) return '—'
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

export function ScheduleClientDetailModal({ client, dashData, barColor, onClose }: Props) {
  const navigate = useNavigate()

  const durationDays = client.endDate
    ? differenceInCalendarDays(new Date(client.endDate + 'T00:00:00'), new Date(client.startDate + 'T00:00:00'))
    : null

  const attention = dashData ? ATTENTION_STYLE[dashData.attentionLevel] ?? ATTENTION_STYLE.None : null
  const planProgress = dashData?.activePlanProgressPercent ?? null

  function goToProfile() {
    onClose()
    navigate(`/coach/clients/${client.clientId}`)
  }

  const content = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', zIndex: 9999 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-2xl flex flex-col gap-0 overflow-hidden"
        style={{ background: 'var(--bg-2)', border: '2px solid var(--surface-border-soft)', boxShadow: 'var(--sh-md)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 pb-4">
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: barColor }}
          >
            {initials(client.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>
              {client.fullName}
            </p>
            <p className="truncate text-xs" style={{ color: 'var(--fg-3)' }}>
              {client.email}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {attention && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ background: `${attention.color}22`, color: attention.color }}
              >
                {attention.label}
              </span>
            )}
            <button type="button" onClick={onClose} style={{ color: 'var(--fg-3)' }}>
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 pb-5">
          {/* Coaching period */}
          <div className="rounded-xl p-3 flex flex-col gap-1.5" style={{ background: 'var(--bg-3)' }}>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--fg-3)' }}>
              <Calendar size={12} />
              Coaching period
            </div>
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--fg-1)' }}>
              <span>{formatDate(client.startDate)}</span>
              <ArrowRight size={13} style={{ color: 'var(--fg-3)' }} />
              <span>{client.endDate ? formatDate(client.endDate) : '∞'}</span>
              {durationDays !== null && (
                <span className="text-xs" style={{ color: 'var(--fg-3)' }}>({durationDays}d)</span>
              )}
            </div>
          </div>

          {/* Activity */}
          {dashData && (
            <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: 'var(--bg-3)' }}>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--fg-3)' }}>
                <Dumbbell size={12} />
                Activity
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--fg-3)' }}>Last workout</span>
                <span className="font-medium" style={{ color: 'var(--fg-1)' }}>{lastWorkoutLabel(dashData)}</span>
              </div>
              {dashData.attentionReasons.length > 0 && (
                <ul className="flex flex-col gap-0.5">
                  {dashData.attentionReasons.map((r, i) => (
                    <li key={i} className="text-xs" style={{ color: 'var(--fg-3)' }}>· {r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Active plan */}
          {dashData?.activePlanName && (
            <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: 'var(--bg-3)' }}>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--fg-3)' }}>
                <TrendingUp size={12} />
                Active plan
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="truncate font-medium" style={{ color: 'var(--fg-1)' }}>{dashData.activePlanName}</span>
                {planProgress !== null && (
                  <span className="ml-2 flex-shrink-0 font-semibold" style={{ color: 'var(--color-success)' }}>
                    {Math.round(planProgress)}%
                  </span>
                )}
              </div>
              {planProgress !== null && (
                <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--bg-2)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${planProgress}%`, background: 'var(--color-success)' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <Button onClick={goToProfile} className="w-full mt-1">
            View Profile
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
