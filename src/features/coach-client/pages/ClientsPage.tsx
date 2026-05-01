import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  CheckCircle2, XCircle, User, Clock, Mail, FileText,
  Flame, Dumbbell, Ruler, Weight, AlertTriangle, TrendingUp,
  CalendarDays, Scale,
} from 'lucide-react'
import { format, differenceInDays, formatDistanceToNow } from 'date-fns'
import { Card } from '@/shared/components/Card'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { Spinner } from '@/shared/components/Spinner'
import { Modal } from '@/shared/components/Modal'
import { useConfirm } from '@/shared/components/ConfirmModal'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import { usePublicUserProfile } from '@/features/profile'
import type { CoachRelationshipResponse, ClientResponse, CoachClientDashboardResponse } from '../types'
import {
  usePendingRequests,
  useMyClients,
  useCoachDashboard,
  useAcceptRequest,
  useTerminateRelationship,
} from '../index'

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
              <FileText size={14} className="mt-0.5 flex-shrink-0" />
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

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="danger" size="sm" loading={declining} onClick={onDecline}>
              <XCircle size={14} /> Decline
            </Button>
            <Button size="sm" loading={accepting} onClick={onAccept}>
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
  onView: () => void
  onDisconnect: () => void
  disconnecting: boolean
}

function ClientCard({ client, stats, onView, onDisconnect, disconnecting }: ClientCardProps) {
  const daysSinceLast = stats?.lastWorkoutDate
    ? differenceInDays(new Date(), new Date(stats.lastWorkoutDate))
    : null
  const isInactive = daysSinceLast === null || daysSinceLast > 5
  const progress = stats?.planProgressPercent ?? null
  const big3 = stats?.bigThreePRs

  return (
    <motion.div
      variants={slideUp}
      className="rounded-2xl overflow-hidden cursor-pointer transition-shadow hover:shadow-md"
      style={{
        background: 'var(--bg-2)',
        border: `1px solid ${isInactive ? 'rgba(245,158,11,0.4)' : 'var(--border-1)'}`,
        borderLeft: isInactive ? '3px solid var(--color-warning)' : undefined,
      }}
      onClick={onView}
    >
      {/* Top row: avatar + identity + actions */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar name={client.fullName} email={client.email} imageUrl={stats?.avatarUrl} size={44} variant="primary" />
          <div className="min-w-0">
            <p className="font-semibold text-text truncate">{client.fullName}</p>
            <p className="text-xs text-muted truncate">{client.email}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>
              Since {format(new Date(client.connectedAt), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {isInactive && (
            <Badge variant="warning">
              <AlertTriangle size={11} className="mr-0.5" />
              Inactive
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={onView}>
            <User size={14} />
          </Button>
          <Button variant="ghost" size="sm" loading={disconnecting} onClick={onDisconnect}>
            <XCircle size={14} className="text-danger" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted">
            <TrendingUp size={11} />
            Plan progress
          </span>
          <span className="font-semibold text-text">
            {progress !== null ? `${progress}%` : '—'}
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
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-3 divide-x text-center"
        style={{ borderTop: '1px solid var(--border-1)' }}
      >
        {/* Last workout */}
        <div className="px-3 py-2.5">
          <div className="flex items-center justify-center gap-1 text-xs text-muted mb-0.5">
            <CalendarDays size={11} />
            Last workout
          </div>
          {stats?.lastWorkoutDate ? (
            <>
              <p className="text-xs font-semibold text-text">
                {format(new Date(stats.lastWorkoutDate), 'dd/MM')}
              </p>
              <p className="text-xs" style={{ color: isInactive ? 'var(--color-warning)' : 'var(--fg-3)' }}>
                {formatDistanceToNow(new Date(stats.lastWorkoutDate), { addSuffix: true })}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted mt-1">No data</p>
          )}
        </div>

        {/* Bodyweight */}
        <div className="px-3 py-2.5">
          <div className="flex items-center justify-center gap-1 text-xs text-muted mb-0.5">
            <Scale size={11} />
            Weight
          </div>
          <p className="text-xs font-semibold text-text mt-1">
            {stats?.latestBodyweightKg ? `${stats.latestBodyweightKg} kg` : '—'}
          </p>
        </div>

        {/* Big 3 */}
        <div className="px-3 py-2.5">
          <div className="flex items-center justify-center gap-1 text-xs text-muted mb-0.5">
            <Dumbbell size={11} />
            Big 3 PR
          </div>
          <div className="text-xs space-y-0.5">
            <p><span className="text-muted">S</span> <span className="font-semibold text-text">{big3?.squat ?? '—'}{big3?.squat ? ' kg' : ''}</span></p>
            <p><span className="text-muted">B</span> <span className="font-semibold text-text">{big3?.bench ?? '—'}{big3?.bench ? ' kg' : ''}</span></p>
            <p><span className="text-muted">D</span> <span className="font-semibold text-text">{big3?.deadlift ?? '—'}{big3?.deadlift ? ' kg' : ''}</span></p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────

export function ClientsPage() {
  const [previewReq, setPreviewReq] = useState<CoachRelationshipResponse | null>(null)
  const shouldReduce = useReducedMotion()
  const navigate = useNavigate()
  const { data: pending, isLoading: pendingLoading } = usePendingRequests()
  const { data: clients, isLoading: clientsLoading } = useMyClients()
  const { data: dashboardData, isLoading: dashboardLoading } = useCoachDashboard()
  const { mutate: accept, isPending: accepting } = useAcceptRequest()
  const { mutate: terminate, isPending: terminating } = useTerminateRelationship()
  const { confirm, ConfirmDialog } = useConfirm()
  const t   = useT()
  const tcl = t.clients

  const loading = pendingLoading || clientsLoading || dashboardLoading

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const activeClients = clients?.filter((c) => c.status === 'Active') ?? []

  // Build a lookup map from clientId → dashboard stats
  const statsMap = new Map<string, CoachClientDashboardResponse>(
    (dashboardData ?? []).map((d) => [d.clientId, d]),
  )

  // Summary numbers
  const inactiveCount = activeClients.filter((c) => {
    const s = statsMap.get(c.clientId)
    const days = s?.lastWorkoutDate
      ? differenceInDays(new Date(), new Date(s.lastWorkoutDate))
      : null
    return days === null || days > 5
  }).length

  return (
    <>
    {ConfirmDialog}
    <div className="space-y-6 sm:space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">{tcl.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {activeClients.length} active client{activeClients.length !== 1 ? 's' : ''}
            {inactiveCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1" style={{ color: 'var(--color-warning)' }}>
                <AlertTriangle size={12} />
                {inactiveCount} inactive
              </span>
            )}
          </p>
        </div>
      </div>

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
                    <UserAvatar name={req.clientName} size={44} variant="primary" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text">{req.clientName}</p>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                        <Clock size={11} />
                        <span>{format(new Date(req.createdAt), 'dd/MM/yyyy HH:mm')}</span>
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
          className="grid gap-3 md:grid-cols-2"
        >
          <AnimatePresence>
            {activeClients.map((client) => (
              <ClientCard
                key={client.relationshipId}
                client={client}
                stats={statsMap.get(client.clientId)}
                onView={() => navigate(`/coach/clients/${client.clientId}`)}
                onDisconnect={async () => {
                  if (await confirm(tcl.disconnectConfirm.replace('{name}', client.fullName), { confirmLabel: tcl.disconnect, danger: true })) {
                    terminate(client.relationshipId)
                  }
                }}
                disconnecting={terminating}
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
    </div>
    </>
  )
}
