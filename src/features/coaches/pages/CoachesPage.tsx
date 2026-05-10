import { useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BriefcaseBusiness, Search, Star, Tags, UserPlus } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Spinner } from '@/shared/components/Spinner'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useT } from '@/shared/i18n'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useMyCoach } from '@/features/coach-client'
import { ConnectCoachModal } from '@/features/coach-client/components/ConnectCoachModal'
import { InlineTip } from '@/features/tips'
import { useCoaches } from '../index'
import { CoachProfileContent } from '../components/CoachProfileContent'

export function CoachesPage() {
  const shouldReduce = useReducedMotion()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [connectTarget, setConnectTarget] = useState<{ id: string; name: string } | null>(null)
  const debouncedSearch = useDebounce(search, 400)
  const t = useT()
  const tco = t.coaches

  const { data: myCoach, isLoading: loadingMyCoach } = useMyCoach()
  const { data: coaches, isLoading } = useCoaches(
    { name: debouncedSearch || undefined },
    !loadingMyCoach && !myCoach,
  )

  function openCoachProfile(coachId: string) {
    navigate(`/coaches/${coachId}`)
  }

  function handleCoachCardKeyDown(event: KeyboardEvent<HTMLDivElement>, coachId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openCoachProfile(coachId)
    }
  }

  if (loadingMyCoach) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (myCoach) {
    return <CoachProfileContent coachId={myCoach.coachId} showBack={false} relationship={myCoach} />
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text">{tco.title}</h1>
          <p className="mt-1 text-sm text-muted">{tco.subtitle}</p>
        </div>

        <InlineTip placement="coaches" audience="individual" />

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
                  {coach.headline && (
                    <p className="line-clamp-2 text-sm text-muted">{coach.headline}</p>
                  )}
                  {coach.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {coach.specialties.slice(0, 3).map((specialty) => (
                        <span key={specialty} className="rounded-full bg-panel px-2.5 py-1 text-xs font-medium text-muted">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="grid gap-2 text-xs text-muted sm:grid-cols-2">
                    {coach.experienceYears !== null && (
                      <span className="flex items-center gap-1.5">
                        <BriefcaseBusiness size={13} /> {coach.experienceYears} yrs
                      </span>
                    )}
                    {coach.packageCount > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Tags size={13} /> {formatStartingPrice(coach.startingPackagePrice)}
                      </span>
                    )}
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
      </div>

      {connectTarget && (
        <ConnectCoachModal
          open={!!connectTarget}
          coachId={connectTarget.id}
          coachName={connectTarget.name}
          onClose={() => setConnectTarget(null)}
        />
      )}
    </>
  )
}

function formatStartingPrice(price: number | null) {
  if (price === null) return 'Packages'
  return `From ${new Intl.NumberFormat('vi-VN').format(price)}`
}
