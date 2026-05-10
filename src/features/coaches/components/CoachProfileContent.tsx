import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import {
  Ban,
  BriefcaseBusiness,
  ChevronLeft,
  Clock,
  FileText,
  Flag,
  Mail,
  Star,
  Tags,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Modal } from '@/shared/components/Modal'
import { Select } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { useConfirm } from '@/shared/components/ConfirmModal'
import { useT } from '@/shared/i18n'
import type { ReportReason } from '@/shared/types/api'
import { useAuthStore } from '@/features/auth'
import { BlockUserModal } from '@/features/blocks/components/BlockUserModal'
import {
  useAcceptRenewal,
  useAcceptTermination,
  useMyCoach,
  useRejectRenewal,
  useRejectTermination,
  useRequestTermination,
  useTerminateRelationship,
} from '@/features/coach-client'
import type { CoachRelationshipResponse } from '@/features/coach-client'
import { formatContractPrice, formatContractSelection } from '@/features/coach-client/utils/contractDisplay'
import type { CoachMarketplaceProfile } from '../types'
import { RenewalModal } from '@/features/coach-client/components/RenewalModal'
import { ConnectCoachModal } from '@/features/coach-client/components/ConnectCoachModal'
import { useCreateUserReport } from '@/features/reports'
import { slideUp, staggerContainer } from '@/shared/utils/motion'
import {
  useCoachProfile,
  useCreateCoachRating,
  useDeleteCoachRating,
  useUpdateCoachRating,
} from '../api/useCoaches'

interface CoachProfileContentProps {
  coachId: string
  showBack?: boolean
  relationship?: CoachRelationshipResponse | null
}

export function CoachProfileContent({
  coachId,
  showBack = true,
  relationship = null,
}: CoachProfileContentProps) {
  const { data: coach, isLoading } = useCoachProfile(coachId)
  const createRating = useCreateCoachRating(coachId)
  const updateRating = useUpdateCoachRating(coachId)
  const deleteRating = useDeleteCoachRating(coachId)
  const createReport = useCreateUserReport(coachId)
  const { data: myCoach } = useMyCoach(!relationship)
  const isCoachRole = useAuthStore((s) => s.user?.roles?.includes('Coach'))
  const currentUserId = useAuthStore((s) => s.user?.id ?? '')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState<ReportReason>('Other')
  const [reportDetails, setReportDetails] = useState('')
  const [connectOpen, setConnectOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [renewalOpen, setRenewalOpen] = useState(false)
  const { mutate: terminate, isPending: terminating } = useTerminateRelationship()
  const { mutate: requestTermination, isPending: requestingTermination } = useRequestTermination()
  const { mutate: acceptTermination, isPending: acceptingTermination } = useAcceptTermination()
  const { mutate: rejectTermination, isPending: rejectingTermination } = useRejectTermination()
  const { mutate: acceptRenewal, isPending: acceptingRenewal } = useAcceptRenewal()
  const { mutate: rejectRenewal, isPending: rejectingRenewal } = useRejectRenewal()
  const { confirm, ConfirmDialog } = useConfirm()
  const t = useT()
  const tco = t.coaches
  const tcp = t.coachProfile

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!coach) return <p className="text-muted">{tcp.notFound}</p>

  const activeRelationship = relationship ?? null
  const marketplace = coach.marketplaceProfile
  const contractPrices = getContractPrices(marketplace)
  const hasContractPrices = contractPrices.length > 0
  const myRating = coach.myRating
  const canConnect = !activeRelationship && !myCoach && !isCoachRole
  const isPendingTermination = activeRelationship?.status === 'PendingTermination'
  const iInitiatedTermination = isPendingTermination && activeRelationship?.terminationRequestedBy === currentUserId
  const coachInitiatedTermination = isPendingTermination && activeRelationship?.terminationRequestedBy !== currentUserId
  const isExpired = activeRelationship?.status === 'Expired'
  const isPendingRenewal = activeRelationship?.status === 'PendingRenewal'
  const iInitiatedRenewal = isPendingRenewal && activeRelationship?.renewalRequestedBy === currentUserId
  const coachInitiatedRenewal = isPendingRenewal && activeRelationship?.renewalRequestedBy !== currentUserId
  const anyTerminationPending = requestingTermination || acceptingTermination || rejectingTermination
  const anyRenewalPending = acceptingRenewal || rejectingRenewal

  function submitRating() {
    const payload = { rating, comment: comment.trim() || null }
    if (myRating) updateRating.mutate(payload)
    else createRating.mutate(payload)
  }

  function submitReport() {
    createReport.mutate(
      { reason: reportReason, details: reportDetails },
      {
        onSuccess: () => {
          setReportOpen(false)
          setReportReason('Other')
          setReportDetails('')
        },
      },
    )
  }

  function formatDate(value: string | null): string {
    if (!value) return 'not set'
    const [y, m, d] = value.split('-')
    return `${d}/${m}/${y}`
  }

  function relationshipStatusLabel() {
    if (!activeRelationship) return null
    if (activeRelationship.status === 'Active') return tco.connected
    if (activeRelationship.status === 'PendingTermination') {
      return iInitiatedTermination ? tco.disconnectPendingByYou : tco.disconnectPendingByOther
    }
    if (activeRelationship.status === 'Expired') return 'Contract expired'
    if (activeRelationship.status === 'PendingRenewal') {
      return iInitiatedRenewal ? 'Renewal pending' : 'Renewal requested'
    }
    return tco.pending
  }

  return (
    <>
      {ConfirmDialog}
      <div className="space-y-6">
        <div className="flex items-start gap-2">
          {showBack && (
            <Link to="/coaches">
              <Button variant="ghost" size="sm"><ChevronLeft size={16} /></Button>
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="min-w-0 break-words text-2xl font-bold text-text">{coach.fullName}</h1>
            {activeRelationship && (
              <p className="mt-1 text-sm text-muted">{tco.coachSubtitle}</p>
            )}
          </div>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid gap-4 md:grid-cols-2"
        >
          <motion.div variants={slideUp}>
            <Card className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <UserAvatar
                    name={coach.fullName}
                    email={coach.email}
                    imageUrl={coach.avatarUrl}
                    size={64}
                    variant={activeRelationship ? 'sage' : 'primary'}
                  />
                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-bold text-text">{coach.fullName}</h2>
                    <p className="text-sm text-muted">{marketplace?.headline ?? 'Coach'}</p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                      <Star size={15} fill="currentColor" />
                      {coach.averageRating?.toFixed(1) ?? '-'} ({coach.ratingCount})
                    </p>
                  </div>
                </div>

                {activeRelationship && (
                  <Badge variant={activeRelationship.status === 'Active' ? 'success' : 'warning'}>
                    {relationshipStatusLabel()}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-muted">
                <Mail size={15} />
                <span className="min-w-0 truncate text-sm">{coach.email}</span>
              </div>

              <div className="flex gap-2 text-muted">
                <FileText size={15} className="mt-0.5 flex-shrink-0" />
                <p className="break-words text-sm leading-relaxed">
                  {coach.bio ?? 'No bio added yet.'}
                </p>
              </div>

              <div className="grid gap-2 text-sm text-muted sm:grid-cols-2">
                {marketplace?.experienceYears !== null && marketplace?.experienceYears !== undefined && (
                  <InfoLine icon={<BriefcaseBusiness size={15} />} label={`${marketplace.experienceYears} years experience`} />
                )}
                {marketplace?.availability && <InfoLine icon={<Clock size={15} />} label={marketplace.availability} />}
                {marketplace?.responseTime && <InfoLine icon={<Mail size={15} />} label={marketplace.responseTime} />}
              </div>

              {contractPrices.length > 0 && (
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  {contractPrices.map((price) => (
                    <div key={price.type} className="rounded-lg border border-border bg-panel px-3 py-2">
                      <p className="text-xs text-muted">{price.label}</p>
                      <p className="font-semibold text-text">{formatContractPrice(price.amount, price.currency)}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeRelationship && (
                <div className="rounded-lg border border-border bg-panel px-3 py-3 text-sm text-muted">
                  <p className="font-medium text-text">Coaching contract</p>
                  <p className="mt-1">
                    {formatDate(activeRelationship.startDate)} - {formatDate(activeRelationship.endDate)}
                  </p>
                  {activeRelationship.selectedCoachingType && (
                    <p className="mt-1 flex items-center gap-1 text-text">
                      <Tags size={13} />
                      {formatContractSelection({
                        type: activeRelationship.selectedCoachingType,
                        price: activeRelationship.selectedPriceAmount,
                        currency: activeRelationship.selectedCurrency ?? 'VND',
                        quantity: activeRelationship.selectedQuantity,
                      })}
                    </p>
                  )}
                  {isPendingRenewal && activeRelationship.proposedEndDate && (
                    <p className="mt-1 text-warning">
                      Proposed renewal until {formatDate(activeRelationship.proposedEndDate)}
                    </p>
                  )}
                </div>
              )}

              {isExpired && (
                <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-3 text-sm text-text">
                  This coaching contract has expired. You can request a renewal or end the relationship.
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {canConnect && (
                  <Button size="sm" disabled={!hasContractPrices} onClick={() => setConnectOpen(true)}>
                    <UserPlus size={15} /> Connect
                  </Button>
                )}
                {activeRelationship?.status === 'Pending' && (
                  <Button
                    variant="danger"
                    size="sm"
                    loading={terminating}
                    onClick={() => terminate(activeRelationship.id)}
                  >
                    {tco.cancelRequest}
                  </Button>
                )}
                {activeRelationship?.status === 'Active' && (
                  <Button
                    variant="danger"
                    size="sm"
                    loading={terminating}
                    onClick={async () => {
                      if (await confirm(tco.disconnectConfirm, { confirmLabel: tco.disconnect, danger: true })) {
                        requestTermination(activeRelationship.id)
                      }
                    }}
                  >
                    <UserMinus size={15} /> {tco.disconnect}
                  </Button>
                )}
                {(isExpired || iInitiatedRenewal) && activeRelationship && (
                  <Button size="sm" onClick={() => setRenewalOpen(true)}>
                    Renew
                  </Button>
                )}
                {coachInitiatedRenewal && activeRelationship && (
                  <>
                    <Button size="sm" loading={anyRenewalPending} onClick={() => acceptRenewal(activeRelationship.id)}>
                      Accept renewal
                    </Button>
                    <Button variant="ghost" size="sm" loading={anyRenewalPending} onClick={() => rejectRenewal(activeRelationship.id)}>
                      Decline
                    </Button>
                  </>
                )}
                {iInitiatedRenewal && activeRelationship && (
                  <Button variant="ghost" size="sm" loading={anyRenewalPending} onClick={() => rejectRenewal(activeRelationship.id)}>
                    Cancel renewal request
                  </Button>
                )}
                {(isExpired || isPendingRenewal) && activeRelationship?.status !== 'PendingTermination' && activeRelationship && (
                  <Button
                    variant="danger"
                    size="sm"
                    loading={terminating}
                    onClick={async () => {
                      if (await confirm(tco.disconnectConfirm, { confirmLabel: tco.disconnect, danger: true })) {
                        requestTermination(activeRelationship.id)
                      }
                    }}
                  >
                    <UserMinus size={15} /> {tco.disconnect}
                  </Button>
                )}
                {iInitiatedTermination && activeRelationship && (
                  <Button variant="ghost" size="sm" loading={anyTerminationPending} onClick={() => rejectTermination(activeRelationship.id)}>
                    {tco.cancelDisconnect}
                  </Button>
                )}
                {coachInitiatedTermination && activeRelationship && (
                  <>
                    <Button variant="danger" size="sm" loading={anyTerminationPending} onClick={() => acceptTermination(activeRelationship.id)}>
                      {tco.acceptDisconnect}
                    </Button>
                    <Button variant="ghost" size="sm" loading={anyTerminationPending} onClick={() => rejectTermination(activeRelationship.id)}>
                      {tco.rejectDisconnect}
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={() => setReportOpen(true)}>
                  <Flag size={15} /> Report
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setBlockOpen(true)}>
                  <Ban size={15} /> Block
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={slideUp}>
            <Card className="flex flex-col justify-center space-y-4">
              <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
                <TrustStat icon={<Users size={24} />} value={String(coach.totalClients)} label={tcp.totalClients} />
                <TrustStat icon={<Star size={24} fill="currentColor" />} value={coach.averageRating?.toFixed(1) ?? '-'} label={`${coach.ratingCount} reviews`} />
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {coach.canRate && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-text">{myRating ? 'Your review' : 'Rate this coach'}</h2>
              {myRating && (
                <Button variant="danger" size="sm" loading={deleteRating.isPending} onClick={() => deleteRating.mutate()}>
                  <Trash2 size={15} /> Delete
                </Button>
              )}
            </div>
            {myRating && (
              <p className="text-sm text-muted">
                Current: {myRating.rating}/5{myRating.comment ? ` - ${myRating.comment}` : ''}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-[160px_1fr_auto]">
              <Select
                label="Rating"
                value={String(rating)}
                onChange={(value) => setRating(Number(value || 5))}
                options={[1, 2, 3, 4, 5].map((value) => ({ value: String(value), label: `${value} star${value > 1 ? 's' : ''}` }))}
              />
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-text">Comment</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  className="xn-input min-h-11 resize-y"
                  placeholder="Optional review..."
                />
              </label>
              <div className="flex items-end">
                <Button loading={createRating.isPending || updateRating.isPending} onClick={submitRating}>
                  <Star size={15} /> {myRating ? 'Update' : 'Submit'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card className="space-y-3">
          <h2 className="text-base font-semibold text-text">Reviews</h2>
          {coach.ratings.length === 0 ? (
            <p className="text-sm text-muted">No reviews yet.</p>
          ) : (
            coach.ratings.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-panel px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-text">{item.clientName}</p>
                  <p className="flex items-center gap-1 text-sm text-muted">
                    <Star size={14} fill="currentColor" /> {item.rating}/5
                  </p>
                </div>
                {item.comment && <p className="mt-1 text-sm text-muted">{item.comment}</p>}
              </div>
            ))
          )}
        </Card>

        <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report user">
          <div className="space-y-4">
            <Select
              label="Reason"
              value={reportReason}
              onChange={(value) => setReportReason((value || 'Other') as ReportReason)}
              options={['Harassment', 'Spam', 'Scam', 'Inappropriate', 'Other'].map((value) => ({ value, label: value }))}
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text">Details</span>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                maxLength={2000}
                className="xn-input min-h-28 resize-y"
                placeholder="Describe what happened..."
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReportOpen(false)}>Cancel</Button>
              <Button
                variant="danger"
                loading={createReport.isPending}
                disabled={!reportDetails.trim()}
                onClick={submitReport}
              >
                Submit report
              </Button>
            </div>
          </div>
        </Modal>

        <ConnectCoachModal
          open={connectOpen}
          coachId={coachId}
          coachName={coach.fullName}
          onClose={() => setConnectOpen(false)}
        />

        <BlockUserModal
          open={blockOpen}
          userId={coachId}
          userName={coach.fullName}
          onClose={() => setBlockOpen(false)}
        />

        {activeRelationship && (
          <RenewalModal
            open={renewalOpen}
            relationshipId={activeRelationship.id}
            currentEndDate={activeRelationship.endDate}
            onClose={() => setRenewalOpen(false)}
          />
        )}
      </div>
    </>
  )
}

function TrustStat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl py-6" style={{ background: 'var(--bg-3)' }}>
      <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
      <p className="mt-2 text-4xl font-black text-text">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  )
}

function InfoLine({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2">
      {icon}
      <span className="min-w-0 truncate">{label}</span>
    </span>
  )
}

function getContractPrices(marketplace: CoachMarketplaceProfile | null | undefined) {
  const currency = marketplace?.currency ?? 'VND'
  return [
    { type: 'Monthly', label: 'Price per month', amount: marketplace?.monthlyPriceAmount ?? null, currency },
    { type: 'Session', label: 'Price per session', amount: marketplace?.sessionPriceAmount ?? null, currency },
  ].filter((price) => price.amount !== null)
}


