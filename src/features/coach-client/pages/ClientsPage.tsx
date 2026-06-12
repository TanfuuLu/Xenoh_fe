import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  CheckCircle2, XCircle, User, Users, Clock, Mail, FileText,
  Flame, Dumbbell, Ruler, Weight, AlertTriangle, TrendingUp,
  CalendarDays, Scale, UserMinus, RefreshCw,
  ClipboardList, KeyRound,
} from 'lucide-react'
import { useAuthStore } from '@/features/auth'
import { useSubscription } from '@/features/billing/api/useSubscription'
import { format, differenceInDays, formatDistanceToNow } from 'date-fns'
import { Card } from '@/shared/components/Card'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { Spinner } from '@/shared/components/Spinner'
import { Modal } from '@/shared/components/Modal'
import { useConfirm } from '@/shared/components/ConfirmModal'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useLangStore, useT } from '@/shared/i18n'
import { usePublicUserProfile } from '@/features/profile'
import { InlineTip } from '@/features/tips'
import type { CoachRelationshipResponse, ClientResponse, CoachClientDashboardResponse } from '../types'
import {
  usePendingRequests,
  useMyClients,
  useCoachDashboard,
  useAcceptRequest,
  useTerminateRelationship,
  useRequestTermination,
  useAcceptTermination,
  useRejectTermination,
  useAcceptRenewal,
  useRejectRenewal,
} from '../index'
import { RenewalModal } from '../components/RenewalModal'
import { CoachScheduleCalendar } from '../components/CoachScheduleCalendar'

function formatContractDate(value: string | null): string {
  if (!value) return 'chưa đặt'
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}

// ─── Requester preview modal (unchanged) ───────────────────────────────────

function StatCard({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--bg-3)' }}>
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted">
        {icon}
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-semibold text-text">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  )
}

function RequesterProfileModal({
  req,
  onClose,
  onAccept,
  onDecline,
  accepting,
  declining,
}: {
  req: CoachRelationshipResponse
  onClose: () => void
  onAccept: () => void
  onDecline: () => void
  accepting: boolean
  declining: boolean
}) {
  const { data: profile, isLoading } = usePublicUserProfile(req.clientId)

  return (
    <Modal open onClose={onClose} title="Request from">
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner />
        </div>
      ) : profile ? (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={profile.fullName}
              email={profile.email}
              imageUrl={profile.avatarUrl}
              size={56}
              variant="primary"
            />
            <div>
              <p className="text-lg font-bold text-text">{profile.fullName}</p>
              <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                <Mail size={13} />
                <span>{profile.email}</span>
              </div>
              {profile.gender && (
                <p className="mt-0.5 text-xs text-muted">{profile.gender}</p>
              )}
            </div>
          </div>

          {profile.bio && (
            <div className="flex items-start gap-2 text-muted">
              <FileText size={14} className="mt-0.5 shrink-0" />
              <p className="text-sm leading-relaxed">{profile.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <StatCard icon={<Ruler size={15} />} label="Height" value={profile.height ? `${profile.height} cm` : '—'} />
            <StatCard icon={<Weight size={15} />} label="Bodyweight" value={profile.latestBodyweight ? `${profile.latestBodyweight} kg` : '—'} />
            <StatCard icon={<Flame size={15} />} label="Streak" value={`${profile.currentStreak} days`} />
            <StatCard
              icon={<Dumbbell size={15} />}
              label="DOTS Score"
              value={profile.dotsScore ? profile.dotsScore.toString() : '—'}
              sub={profile.bmi ? `BMI ${profile.bmi} · ${profile.bmiCategory}` : undefined}
            />
          </div>

          <p className="text-xs text-muted">
            Requested on {format(new Date(req.createdAt), 'dd/MM/yyyy HH:mm')}
          </p>
          <p className="flex items-center gap-1 text-sm text-text">
            <CalendarDays size={14} />
            Requested contract: {formatContractDate(req.startDate)} - {formatContractDate(req.endDate)}
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="danger" size="sm" loading={declining} onClick={onDecline}>
              <XCircle size={14} /> Decline
            </Button>
            <Button size="sm" loading={accepting} onClick={onAccept} >
              <CheckCircle2 size={14} /> Accept
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">Could not load profile.</p>
      )}
    </Modal>
  )
}

// ─── Client dashboard card ─────────────────────────────────────────────────

interface ClientCardProps {
  client: ClientResponse
  stats: CoachClientDashboardResponse | undefined
  currentUserId: string
  onView: () => void
  onDisconnect: () => void
  onCancelDisconnect: () => void
  onAcceptDisconnect: () => void
  onRejectDisconnect: () => void
  onProposeRenewal: () => void
  onAcceptRenewal: () => void
  onRejectRenewal: () => void
  disconnecting: boolean
  renewalPending: boolean
}

function attentionRank(level: CoachClientDashboardResponse['attentionLevel'] | undefined) {
  if (level === 'High') return 3
  if (level === 'Medium') return 2
  if (level === 'Low') return 1
  return 0
}

function reasonBadgeVariant(reason: string): 'success' | 'danger' | 'warning' | 'default' | 'primary' {
  if (reason === 'No active plan' || reason === 'No workout history') return 'danger'
  if (reason === 'Inactive' || reason === 'Missed days' || reason === 'Behind plan') return 'warning'
  return 'default'
}

function ClientCard({ client, stats, currentUserId, onView, onDisconnect, onCancelDisconnect, onAcceptDisconnect, onRejectDisconnect, onProposeRenewal, onAcceptRenewal, onRejectRenewal, disconnecting, renewalPending }: ClientCardProps) {
  const lang = useLangStore((s) => s.lang)
  const tx = clientsPageText(lang)
  const isPendingTermination = client.status === 'PendingTermination'
  const iInitiated = isPendingTermination && client.terminationRequestedBy === currentUserId
  const clientInitiated = isPendingTermination && client.terminationRequestedBy !== currentUserId
  const isExpired = client.status === 'Expired'
  const isPendingRenewal = client.status === 'PendingRenewal'
  const iInitiatedRenewal = isPendingRenewal && client.renewalRequestedBy === currentUserId
  const clientInitiatedRenewal = isPendingRenewal && client.renewalRequestedBy !== currentUserId
  const daysSinceLast = stats?.daysSinceLastWorkout ?? (
    stats?.lastWorkoutDate
      ? differenceInDays(new Date(), new Date(stats.lastWorkoutDate))
      : null
  )
  const isInactive = daysSinceLast === null || daysSinceLast > 5
  const progress = stats?.activePlanProgressPercent ?? stats?.planProgressPercent ?? null
  const big3 = stats?.bigThreePRs
  const attentionLevel = stats?.attentionLevel ?? 'None'
  const accentColor =
    attentionLevel === 'High' ? 'var(--color-danger)' :
    attentionLevel === 'Medium' ? 'var(--color-warning)' :
    attentionLevel === 'Low' ? 'var(--color-primary)' :
    null
  const latestCompletedWorkoutDate = stats?.latestCompletedWorkoutDate ?? null
  const completedWorkoutToday = stats?.completedWorkoutToday ?? false
  const completionLabel = completedWorkoutToday
    ? tx.doneToday
    : latestCompletedWorkoutDate
      ? tx.lastDone.replace('{time}', formatDistanceToNow(new Date(latestCompletedWorkoutDate), { addSuffix: true }))
      : null
  const completionCount = stats && stats.activePlanTotalWorkoutCount > 0
    ? `${stats.activePlanCompletedWorkoutCount}/${stats.activePlanTotalWorkoutCount}`
    : null
  const daysLeft = client.endDate ? differenceInDays(new Date(client.endDate), new Date()) : null
  const hasWorkoutData = Boolean(
    stats?.lastWorkoutDate || stats?.latestBodyweightKg || big3?.squat || big3?.bench || big3?.deadlift,
  )

  return (
    <motion.div
      variants={slideUp}
      className="rounded-2xl overflow-hidden cursor-pointer transition-shadow hover:shadow-md"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
      onClick={onView}
    >
      {/* Top row: avatar + identity + actions */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar name={client.fullName} email={client.email} imageUrl={stats?.avatarUrl} size={48} variant="primary" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-semibold text-text truncate">{client.fullName}</p>
              {accentColor && !isPendingTermination && (
                <span
                  className="inline-flex flex-shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: accentColor }}
                >
                  <AlertTriangle size={10} />
                  {translateAttentionLevel(attentionLevel, lang)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted truncate">{client.email}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>
              {tx.since} {format(new Date(client.connectedAt), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {isPendingTermination && (
            <Badge variant="warning">
              <UserMinus size={11} className="mr-0.5" />
              {iInitiated ? tx.awaitingResponse : tx.wantsToDisconnect}
            </Badge>
          )}
          {isExpired && (
            <Badge variant="warning">
              <Clock size={11} className="mr-0.5" />
              {tx.expired}
            </Badge>
          )}
          {isPendingRenewal && (
            <Badge variant="warning">
              <RefreshCw size={11} className="mr-0.5" />
              {iInitiatedRenewal ? tx.renewalPending : tx.renewalProposed}
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={onView}>
            <User size={14} />
          </Button>
          {!isPendingTermination && (
            <Button variant="ghost" size="sm" loading={disconnecting} onClick={onDisconnect}>
              <XCircle size={14} className="text-danger" />
            </Button>
          )}
          {iInitiated && (
            <Button variant="ghost" size="sm" loading={disconnecting} onClick={onCancelDisconnect}>
              <XCircle size={14} className="text-muted" />
            </Button>
          )}
          {clientInitiated && (
            <>
              <Button size="sm" variant="danger" loading={disconnecting} onClick={onAcceptDisconnect}>
                <CheckCircle2 size={14} />
              </Button>
              <Button size="sm" variant="ghost" loading={disconnecting} onClick={onRejectDisconnect}>
                <XCircle size={14} />
              </Button>
            </>
          )}
          {(isExpired || iInitiatedRenewal) && (
            <Button size="sm" variant="ghost" onClick={onProposeRenewal}>
              <RefreshCw size={14} />
            </Button>
          )}
          {clientInitiatedRenewal && (
            <>
              <Button size="sm" loading={renewalPending} onClick={onAcceptRenewal}>
                <CheckCircle2 size={14} />
              </Button>
              <Button size="sm" variant="ghost" loading={renewalPending} onClick={onRejectRenewal}>
                <XCircle size={14} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Contract line */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 pb-3 text-xs text-muted">
        <CalendarDays size={11} className="flex-shrink-0" />
        <span>{formatContractDate(client.startDate)} → {formatContractDate(client.endDate)}</span>
        {isPendingRenewal && client.proposedEndDate && (
          <span className="text-warning">({tx.proposed} {formatContractDate(client.proposedEndDate)})</span>
        )}
        {daysLeft !== null && daysLeft >= 0 && !isExpired && (
          <span
            className="ml-auto rounded-full px-2 py-0.5 font-medium"
            style={
              daysLeft <= 7
                ? { background: 'rgba(245,158,11,0.12)', color: 'var(--color-warning)' }
                : { background: 'var(--bg-3)', color: 'var(--fg-2)' }
            }
          >
            {daysLeft === 0 ? tx.endsToday : tx.daysLeft.replace('{n}', String(daysLeft))}
          </span>
        )}
      </div>

      {/* Plan progress */}
      <div className="px-4 pb-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted min-w-0">
            <TrendingUp size={11} className="flex-shrink-0" />
            <span className="truncate">{stats?.activePlanName ?? tx.planProgress}</span>
          </span>
          <span className="flex-shrink-0 font-semibold text-text">
            {progress !== null ? `${progress}%` : '—'}
            {completionCount && <span className="ml-1.5 font-normal text-muted">{completionCount}</span>}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--bg-3)' }}>
          {progress !== null && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{
                background: progress >= 80
                  ? 'var(--color-success)'
                  : progress >= 40
                  ? 'var(--color-primary)'
                  : 'var(--color-warning)',
              }}
            />
          )}
        </div>
        {stats?.attentionReasons && stats.attentionReasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {stats.attentionReasons.map((reason) => (
              <Badge key={reason} variant={reasonBadgeVariant(reason)}>
                {translateAttentionReason(reason, lang)}
              </Badge>
            ))}
          </div>
        )}
        {completionLabel && (
          <div
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium"
            style={{
              background: completedWorkoutToday ? 'rgba(34,197,94,0.12)' : 'var(--bg-3)',
              color: completedWorkoutToday ? 'var(--color-success)' : 'var(--fg-2)',
            }}
          >
            <CheckCircle2 size={12} />
            {completionLabel}
          </div>
        )}
      </div>

      {/* Stats footer */}
      {hasWorkoutData ? (
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 text-xs"
          style={{ borderTop: '1px solid var(--border-1)' }}
        >
          <span className="flex items-center gap-1.5">
            <CalendarDays size={12} className="text-muted" />
            {stats?.lastWorkoutDate ? (
              <span
                className="font-medium"
                style={{ color: isInactive ? 'var(--color-warning)' : 'var(--fg-2)' }}
              >
                {formatDistanceToNow(new Date(stats.lastWorkoutDate), { addSuffix: true })}
              </span>
            ) : (
              <span className="text-muted">{tx.noData}</span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <Scale size={12} className="text-muted" />
            <span className="font-medium text-text">
              {stats?.latestBodyweightKg ? `${stats.latestBodyweightKg} kg` : '—'}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Dumbbell size={12} className="text-muted" />
            <span className="text-muted">S/B/D</span>
            <span className="font-medium text-text">
              {big3?.squat ?? '—'} / {big3?.bench ?? '—'} / {big3?.deadlift ?? '—'}
            </span>
          </span>
        </div>
      ) : (
        <div
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-muted"
          style={{ borderTop: '1px solid var(--border-1)' }}
        >
          <Dumbbell size={12} />
          {tx.noWorkoutData}
        </div>
      )}
    </motion.div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────

export function ClientsPage() {
  const lang = useLangStore((s) => s.lang)
  const tx = clientsPageText(lang)
  const [previewReq, setPreviewReq] = useState<CoachRelationshipResponse | null>(null)
  const shouldReduce = useReducedMotion()
  const navigate = useNavigate()
  const currentUserId = useAuthStore((s) => s.user?.id ?? '')
  const { data: subscription } = useSubscription()
  const maxClients = subscription?.tier === 'ProCoach' && subscription.isActive ? Number.MAX_SAFE_INTEGER : 5
  const { data: pending, isLoading: pendingLoading } = usePendingRequests()
  const { data: clients, isLoading: clientsLoading } = useMyClients()
  const { data: dashboardData, isLoading: dashboardLoading } = useCoachDashboard()
  const { mutate: accept, isPending: accepting } = useAcceptRequest()
  const { mutate: terminate, isPending: terminating } = useTerminateRelationship()
  const { mutate: requestTermination, isPending: requestingTermination } = useRequestTermination()
  const { mutate: acceptTermination, isPending: acceptingTermination } = useAcceptTermination()
  const { mutate: rejectTermination, isPending: rejectingTermination } = useRejectTermination()
  const { mutate: acceptRenewal, isPending: acceptingRenewal } = useAcceptRenewal()
  const { mutate: rejectRenewal, isPending: rejectingRenewal } = useRejectRenewal()
  const { confirm, ConfirmDialog } = useConfirm()
  const [renewalTarget, setRenewalTarget] = useState<ClientResponse | null>(null)
  const t   = useT()
  const tcl = t.clients

  const anyTerminationPending = requestingTermination || acceptingTermination || rejectingTermination
  const anyRenewalPending = acceptingRenewal || rejectingRenewal

  const loading = pendingLoading || clientsLoading || dashboardLoading

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const activeClients = clients?.filter((c) =>
    c.status === 'Active' ||
    c.status === 'PendingTermination' ||
    c.status === 'Expired' ||
    c.status === 'PendingRenewal',
  ) ?? []

  // Build a lookup map from clientId → dashboard stats
  const statsMap = new Map<string, CoachClientDashboardResponse>(
    (dashboardData ?? []).map((d) => [d.clientId, d]),
  )

  // Summary numbers
  const inactiveCount = activeClients.filter((c) => {
    const s = statsMap.get(c.clientId)
    const days = s?.daysSinceLastWorkout ?? (
      s?.lastWorkoutDate
        ? differenceInDays(new Date(), new Date(s.lastWorkoutDate))
        : null
    )
    return days === null || days > 5
  }).length
  const needsAttentionCount = activeClients.filter((c) => {
    const level = statsMap.get(c.clientId)?.attentionLevel ?? 'None'
    return level !== 'None'
  }).length
  const noActivePlanCount = activeClients.filter((c) => {
    const stats = statsMap.get(c.clientId)
    return stats != null && !stats.activePlanId
  }).length
  const sortedActiveClients = [...activeClients].sort((a, b) => {
    const aStats = statsMap.get(a.clientId)
    const bStats = statsMap.get(b.clientId)
    const byAttention = attentionRank(bStats?.attentionLevel) - attentionRank(aStats?.attentionLevel)
    if (byAttention !== 0) return byAttention

    const aDays = aStats?.daysSinceLastWorkout ?? (aStats?.lastWorkoutDate ? differenceInDays(new Date(), new Date(aStats.lastWorkoutDate)) : Number.POSITIVE_INFINITY)
    const bDays = bStats?.daysSinceLastWorkout ?? (bStats?.lastWorkoutDate ? differenceInDays(new Date(), new Date(bStats.lastWorkoutDate)) : Number.POSITIVE_INFINITY)
    if (aDays !== bDays) return bDays - aDays

    return a.fullName.localeCompare(b.fullName)
  })

  return (
    <>
    {ConfirmDialog}
    <div className="space-y-6 sm:space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-text">{tcl.title}</h1>
            <InlineTip placement="clients" audience="coach" />
          </div>
          <p className="mt-1 text-sm text-muted">
            {tx.activeClientsCount.replace('{n}', String(activeClients.length))}
            {inactiveCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1" style={{ color: 'var(--color-warning)' }}>
                <AlertTriangle size={12} />
                {tx.inactiveCount.replace('{n}', String(inactiveCount))}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => navigate('/coach/key-vault')}
        >
          <KeyRound size={14} /> {tx.keyVault}
        </Button>
      </div>

      <div className="grid gap-3 min-[390px]:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users size={15} />} label={tx.statActiveClients} value={String(activeClients.length)} />
        <StatCard icon={<AlertTriangle size={15} />} label={tx.statNeedAttention} value={String(needsAttentionCount)} />
        <StatCard icon={<ClipboardList size={15} />} label={tx.statNoActivePlan} value={String(noActivePlanCount)} />
        <StatCard icon={<CalendarDays size={15} />} label={tx.statInactive} value={String(inactiveCount)} />
      </div>

      {/* Schedule calendar */}
      <CoachScheduleCalendar
        clients={activeClients}
        pendingRequests={pending ?? []}
        maxClients={maxClients}
      />

      {/* Pending requests */}
      {(pending?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            {tcl.pendingHeader} ({pending?.length})
          </h2>
          <motion.div
            initial={shouldReduce ? false : 'hidden'}
            animate="visible"
            variants={staggerContainer}
            className="space-y-2"
          >
            <AnimatePresence>
              {pending?.map((req) => (
                <motion.div
                  key={req.id}
                  variants={slideUp}
                  layout
                  exit={{ opacity: 0, height: 0 }}
                  onClick={() => setPreviewReq(req)}
                  className="flex cursor-pointer flex-col gap-3 rounded-xl border px-4 py-4 transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderColor: 'var(--xn-warning)', background: 'var(--xn-warning-bg)' }}
                >
                  <div className="flex min-w-0 items-center gap-3 self-stretch sm:self-auto">
                    <UserAvatar name={req.clientName} imageUrl={req.clientAvatarUrl} size={44} variant="primary" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text">{req.clientName}</p>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                        <Clock size={11} />
                        <span>{format(new Date(req.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                        <CalendarDays size={11} />
                        <span>{formatContractDate(req.startDate)} - {formatContractDate(req.endDate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <Button
                      size="sm"
                      className="flex-1 sm:flex-none"
                      loading={accepting}
                      onClick={(e) => { e.stopPropagation(); accept(req.id) }}
                    >
                      <CheckCircle2 size={14} /> {tcl.accept}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex-1 sm:flex-none"
                      loading={terminating}
                      onClick={(e) => { e.stopPropagation(); terminate(req.id) }}
                    >
                      <XCircle size={14} /> {tcl.decline}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </section>
      )}

      {/* Active clients dashboard grid */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          {tcl.activeHeader} ({activeClients.length})
        </h2>
        <motion.div
          initial={shouldReduce ? false : 'hidden'}
          animate="visible"
          variants={staggerContainer}
          className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3"
        >
          <AnimatePresence>
            {sortedActiveClients.map((client) => (
              <ClientCard
                key={client.relationshipId}
                client={client}
                stats={statsMap.get(client.clientId)}
                currentUserId={currentUserId}
                onView={() => navigate(`/coach/clients/${client.clientId}`)}
                onDisconnect={async () => {
                  if (await confirm(tcl.disconnectConfirm.replace('{name}', client.fullName), { confirmLabel: tcl.disconnect, danger: true })) {
                    requestTermination(client.relationshipId)
                  }
                }}
                onCancelDisconnect={() => rejectTermination(client.relationshipId)}
                onAcceptDisconnect={() => acceptTermination(client.relationshipId)}
                onRejectDisconnect={() => rejectTermination(client.relationshipId)}
                onProposeRenewal={() => setRenewalTarget(client)}
                onAcceptRenewal={() => acceptRenewal(client.relationshipId)}
                onRejectRenewal={() => rejectRenewal(client.relationshipId)}
                disconnecting={terminating || anyTerminationPending}
                renewalPending={anyRenewalPending}
              />
            ))}
          </AnimatePresence>

          {activeClients.length === 0 && (
            <Card className="py-8 text-center text-muted md:col-span-2">{tcl.noActive}</Card>
          )}
        </motion.div>
      </section>

      {previewReq && (
        <RequesterProfileModal
          req={previewReq}
          onClose={() => setPreviewReq(null)}
          onAccept={() => { accept(previewReq.id); setPreviewReq(null) }}
          onDecline={() => { terminate(previewReq.id); setPreviewReq(null) }}
          accepting={accepting}
          declining={terminating}
        />
      )}

      {renewalTarget && (
        <RenewalModal
          open
          relationshipId={renewalTarget.relationshipId}
          currentEndDate={renewalTarget.endDate}
          onClose={() => setRenewalTarget(null)}
        />
      )}

    </div>
    </>
  )
}

function clientsPageText(lang: 'en' | 'vi') {
  return lang === 'vi'
    ? {
      keyVault: 'Két mã',
      activeClientsCount: '{n} client đang hoạt động',
      inactiveCount: '{n} không hoạt động',
      statActiveClients: 'Client đang hoạt động',
      statNeedAttention: 'Cần chú ý',
      statNoActivePlan: 'Chưa có plan',
      statInactive: 'Không hoạt động',
      since: 'Từ',
      awaitingResponse: 'Đang chờ phản hồi',
      wantsToDisconnect: 'Muốn ngắt kết nối',
      expired: 'Hết hạn',
      renewalPending: 'Đang chờ gia hạn',
      renewalProposed: 'Đã đề xuất gia hạn',
      contract: 'Hợp đồng',
      proposed: 'đề xuất',
      planProgress: 'Tiến độ plan',
      lastWorkout: 'Buổi tập gần nhất',
      noData: 'Chưa có dữ liệu',
      weight: 'Cân nặng',
      bigThreePr: 'PR Big 3',
      doneToday: 'Đã tập hôm nay',
      lastDone: 'Tập gần nhất {time}',
      daysLeft: 'Còn {n} ngày',
      endsToday: 'Kết thúc hôm nay',
      noWorkoutData: 'Chưa có dữ liệu tập luyện',
    }
    : {
      keyVault: 'Key Vault',
      activeClientsCount: '{n} active client(s)',
      inactiveCount: '{n} inactive',
      statActiveClients: 'Active clients',
      statNeedAttention: 'Need attention',
      statNoActivePlan: 'No active plan',
      statInactive: 'Inactive',
      since: 'Since',
      awaitingResponse: 'Awaiting response',
      wantsToDisconnect: 'Wants to disconnect',
      expired: 'Expired',
      renewalPending: 'Renewal pending',
      renewalProposed: 'Renewal proposed',
      contract: 'Contract',
      proposed: 'proposed',
      planProgress: 'Plan progress',
      lastWorkout: 'Last workout',
      noData: 'No data',
      weight: 'Weight',
      bigThreePr: 'Big 3 PR',
      doneToday: 'Done today',
      lastDone: 'Last done {time}',
      daysLeft: '{n} days left',
      endsToday: 'Ends today',
      noWorkoutData: 'No workout data yet',
    }
}

function translateAttentionLevel(level: string, lang: 'en' | 'vi') {
  if (lang !== 'vi') return level
  if (level === 'High') return 'Cao'
  if (level === 'Medium') return 'Trung bình'
  if (level === 'Low') return 'Thấp'
  return level
}

function translateAttentionReason(reason: string, lang: 'en' | 'vi') {
  if (lang !== 'vi') return reason
  const map: Record<string, string> = {
    'No active plan': 'Chưa có plan',
    'No workout history': 'Chưa có lịch sử tập',
    Inactive: 'Không hoạt động',
    'Missed days': 'Bỏ lỡ ngày tập',
    'Behind plan': 'Trễ tiến độ',
  }
  return map[reason] ?? reason
}


