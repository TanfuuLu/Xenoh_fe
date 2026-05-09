import { useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Mail, Search, Star, User, UserMinus, UserPlus, Users } from 'lucide-react'
import { Input } from '@/shared/components/Input'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import { useConfirm } from '@/shared/components/ConfirmModal'
import { useCoaches, useCoachProfile } from '../index'
import { InlineTip } from '@/features/tips'
import { useMyCoach, useTerminateRelationship, useRequestTermination, useAcceptTermination, useRejectTermination, useAcceptRenewal, useRejectRenewal } from '@/features/coach-client'
import { ConnectCoachModal } from '@/features/coach-client/components/ConnectCoachModal'
import { RenewalModal } from '@/features/coach-client/components/RenewalModal'
import { useAuthStore } from '@/features/auth'

export function CoachesPage() {
  const shouldReduce = useReducedMotion()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const t   = useT()
  const tco = t.coaches
  const tcp = t.coachProfile

  const { data: myCoach, isLoading: loadingMyCoach } = useMyCoach()
  const hasCoach = !!myCoach
  const { data: coachProfile, isLoading: loadingCoachProfile } = useCoachProfile(myCoach?.coachId ?? '')
  const { data: coaches, isLoading } = useCoaches(
    { name: debouncedSearch || undefined },
    !loadingMyCoach && !hasCoach,
  )
  const currentUserId = useAuthStore((s) => s.user?.id ?? '')
  const { mutate: terminate, isPending: terminating } = useTerminateRelationship()
  const { mutate: requestTermination, isPending: requestingTermination } = useRequestTermination()
  const { mutate: acceptTermination, isPending: acceptingTermination } = useAcceptTermination()
  const { mutate: rejectTermination, isPending: rejectingTermination } = useRejectTermination()
  const { mutate: acceptRenewal, isPending: acceptingRenewal } = useAcceptRenewal()
  const { mutate: rejectRenewal, isPending: rejectingRenewal } = useRejectRenewal()
  const { confirm, ConfirmDialog } = useConfirm()
  const [connectTarget, setConnectTarget] = useState<{ id: string; name: string } | null>(null)
  const [renewalOpen, setRenewalOpen] = useState(false)

  const isPendingTermination = myCoach?.status === 'PendingTermination'
  const iInitiatedTermination = isPendingTermination && myCoach?.terminationRequestedBy === currentUserId
  const coachInitiatedTermination = isPendingTermination && myCoach?.terminationRequestedBy !== currentUserId
  const isExpired = myCoach?.status === 'Expired'
  const isPendingRenewal = myCoach?.status === 'PendingRenewal'
  const iInitiatedRenewal = isPendingRenewal && myCoach?.renewalRequestedBy === currentUserId
  const coachInitiatedRenewal = isPendingRenewal && myCoach?.renewalRequestedBy !== currentUserId
  const anyTerminationPending = requestingTermination || acceptingTermination || rejectingTermination
  const anyRenewalPending = acceptingRenewal || rejectingRenewal

  const currentCoach = coachProfile ?? coaches?.find((coach) => coach.id === myCoach?.coachId)

  function formatDate(value: string | null): string {
    if (!value) return 'chưa đặt'
    const [y, m, d] = value.split('-')
    return `${d}/${m}/${y}`
  }

  function openCoachProfile(coachId: string) {
    navigate(`/coaches/${coachId}`)
  }

  function handleCoachCardKeyDown(event: KeyboardEvent<HTMLDivElement>, coachId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openCoachProfile(coachId)
    }
  }

  return (
    <>
    {ConfirmDialog}
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{hasCoach ? tco.coachTitle : tco.title}</h1>
        <p className="mt-1 text-sm text-muted">{hasCoach ? tco.coachSubtitle : tco.subtitle}</p>
      </div>

      <InlineTip placement="coaches" audience="individual" />

      {loadingMyCoach || (hasCoach && loadingCoachProfile) ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner />
        </div>
      ) : myCoach ? (
        <motion.div
          initial={shouldReduce ? false : 'hidden'}
          animate="visible"
          variants={slideUp}
          className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]"
        >
          <Card animate={false} className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <UserAvatar
                  name={currentCoach?.fullName ?? myCoach.coachName}
                  email={currentCoach?.email}
                  imageUrl={currentCoach?.avatarUrl}
                  size={72}
                  variant="sage"
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">{tco.currentCoach}</p>
                  <h2 className="truncate text-2xl font-bold text-text">
                    {currentCoach?.fullName ?? myCoach.coachName}
                  </h2>
                  <Badge variant={myCoach.status === 'Active' ? 'success' : 'warning'}>
                    {myCoach.status === 'Active'
                      ? tco.connected
                      : myCoach.status === 'PendingTermination'
                      ? (iInitiatedTermination ? tco.disconnectPendingByYou : tco.disconnectPendingByOther)
                      : myCoach.status === 'Expired'
                      ? 'Hợp đồng đã hết hạn'
                      : myCoach.status === 'PendingRenewal'
                      ? (iInitiatedRenewal ? 'Chờ phản hồi gia hạn' : 'Đối tác đề nghị gia hạn')
                      : tco.pending}
                  </Badge>
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-2 min-[390px]:flex-row sm:w-auto sm:items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full min-[390px]:w-auto"
                  onClick={() => openCoachProfile(myCoach.coachId)}
                >
                  <User size={15} /> {tcp.viewProfile}
                </Button>
                {myCoach.status === 'Pending' && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full min-[390px]:w-auto"
                    loading={terminating}
                    onClick={() => terminate(myCoach.id)}
                  >
                    {tco.cancelRequest}
                  </Button>
                )}
                {myCoach.status === 'Active' && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full min-[390px]:w-auto"
                    loading={terminating}
                    onClick={async () => {
                      if (await confirm(tco.disconnectConfirm, { confirmLabel: tco.disconnect, danger: true })) {
                        requestTermination(myCoach.id)
                      }
                    }}
                  >
                    <UserMinus size={15} /> {tco.disconnect}
                  </Button>
                )}
                {(isExpired || iInitiatedRenewal) && (
                  <Button
                    size="sm"
                    className="w-full min-[390px]:w-auto"
                    onClick={() => setRenewalOpen(true)}
                  >
                    Gia hạn
                  </Button>
                )}
                {coachInitiatedRenewal && (
                  <>
                    <Button
                      size="sm"
                      className="w-full min-[390px]:w-auto"
                      loading={anyRenewalPending}
                      onClick={() => acceptRenewal(myCoach.id)}
                    >
                      Chấp nhận gia hạn
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full min-[390px]:w-auto"
                      loading={anyRenewalPending}
                      onClick={() => rejectRenewal(myCoach.id)}
                    >
                      Từ chối
                    </Button>
                  </>
                )}
                {iInitiatedRenewal && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full min-[390px]:w-auto"
                    loading={anyRenewalPending}
                    onClick={() => rejectRenewal(myCoach.id)}
                  >
                    Hủy yêu cầu gia hạn
                  </Button>
                )}
                {(isExpired || isPendingRenewal) && myCoach.status !== 'PendingTermination' && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full min-[390px]:w-auto"
                    loading={terminating}
                    onClick={async () => {
                      if (await confirm(tco.disconnectConfirm, { confirmLabel: tco.disconnect, danger: true })) {
                        requestTermination(myCoach.id)
                      }
                    }}
                  >
                    <UserMinus size={15} /> {tco.disconnect}
                  </Button>
                )}
                {iInitiatedTermination && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full min-[390px]:w-auto"
                    loading={anyTerminationPending}
                    onClick={() => rejectTermination(myCoach.id)}
                  >
                    {tco.cancelDisconnect}
                  </Button>
                )}
                {coachInitiatedTermination && (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      className="w-full min-[390px]:w-auto"
                      loading={anyTerminationPending}
                      onClick={() => acceptTermination(myCoach.id)}
                    >
                      {tco.acceptDisconnect}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full min-[390px]:w-auto"
                      loading={anyTerminationPending}
                      onClick={() => rejectTermination(myCoach.id)}
                    >
                      {tco.rejectDisconnect}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-3 text-muted">
                <Mail size={16} />
                <span className="min-w-0 truncate text-sm">{currentCoach?.email ?? '-'}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-3 text-muted">
                <Users size={16} />
                <span className="text-sm">
                  {coachProfile?.totalClients ?? 0} {tcp.totalClients}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-panel px-3 py-3 text-sm text-muted">
              <p className="font-medium text-text">Hợp đồng huấn luyện</p>
              <p className="mt-1">
                {formatDate(myCoach.startDate)} → {formatDate(myCoach.endDate)}
              </p>
              {isPendingRenewal && myCoach.proposedEndDate && (
                <p className="mt-1 text-warning">
                  Đề xuất gia hạn đến {formatDate(myCoach.proposedEndDate)}
                </p>
              )}
            </div>

            {isExpired && (
              <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-3 text-sm text-text">
                Hợp đồng đã hết hạn. Bạn có thể gửi yêu cầu gia hạn hoặc kết thúc hợp đồng. Bạn vẫn có thể tiếp tục plan hiện tại trong khi chờ.
              </div>
            )}

            <p className="text-sm text-muted">{tco.coachDescription}</p>
          </Card>

          <Card animate={false} className="flex flex-col justify-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{tco.relationshipStatus}</p>
            <p className="text-3xl font-black text-text">
              {myCoach.status === 'Active'
                ? tco.connected
                : myCoach.status === 'PendingTermination'
                ? (iInitiatedTermination ? tco.disconnectPendingByYou : tco.disconnectPendingByOther)
                : tco.pending}
            </p>
            <p className="text-sm text-muted">{tco.connectedSince} {new Date(myCoach.createdAt).toLocaleDateString()}</p>
          </Card>
        </motion.div>
      ) : (
        <>
          <Input
            placeholder={tco.searchPlaceholder}
            leftIcon={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <motion.div
              initial={shouldReduce ? false : 'hidden'}
              animate="visible"
              variants={staggerContainer}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence>
                {coaches?.map((coach) => (
                  <motion.div
                    key={coach.id}
                    variants={slideUp}
                    layout
                    role="button"
                    tabIndex={0}
                    onClick={() => openCoachProfile(coach.id)}
                    onKeyDown={(event) => handleCoachCardKeyDown(event, coach.id)}
                    className="flex cursor-pointer flex-col gap-4 rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/35"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={coach.fullName}
                        email={coach.email}
                        imageUrl={coach.avatarUrl}
                        size={52}
                        variant="clay"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-text">{coach.fullName}</p>
                        <p className="truncate text-xs text-muted">{coach.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1 text-sm text-muted">
                        <Star size={13} fill="currentColor" />
                        {coach.averageRating?.toFixed(1) ?? '-'}
                        <span className="text-xs">({coach.ratingCount})</span>
                      </p>
                      <Button
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation()
                          setConnectTarget({ id: coach.id, name: coach.fullName })
                        }}
                      >
                        <UserPlus size={15} /> {tco.connectBtn}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {coaches?.length === 0 && (
                <p className="text-center text-muted py-8 col-span-full">{tco.noResults}</p>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
    {connectTarget && (
      <ConnectCoachModal
        open={!!connectTarget}
        coachId={connectTarget.id}
        coachName={connectTarget.name}
        onClose={() => setConnectTarget(null)}
      />
    )}
    {myCoach && (
      <RenewalModal
        open={renewalOpen}
        relationshipId={myCoach.id}
        currentEndDate={myCoach.endDate}
        onClose={() => setRenewalOpen(false)}
      />
    )}
    </>
  )
}
